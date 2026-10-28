import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useLedger } from './LedgerProvider';
import { dateKey, isDateKey, parseAmount } from './expenseCalculations';
import { ledgerError } from './ledgerFiles';
import type {
  Expense,
  ExpenseCategory,
  ExpenseReceipt,
  PaymentMethod,
} from './types';

export interface ExpenseDraft {
  name: string;
  category: ExpenseCategory;
  subcategory: string;
  amount: string;
  date: string;
  time: string;
  vendor: string;
  payment?: PaymentMethod;
  notes: string;
  receipt?: ExpenseReceipt;
}
export function validateExpenseDraft(draft: ExpenseDraft) {
  const amount = parseAmount(draft.amount);
  return {
    name: !draft.name.trim() ? 'ledger.nameRequired' : undefined,
    amount:
      amount === undefined || amount <= 0
        ? 'ledger.validAmountRequired'
        : undefined,
    date: !isDateKey(draft.date) ? 'ledger.invalidRange' : undefined,
    time: !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)
      ? 'ledger.invalidTime'
      : undefined,
  };
}
export function useExpenseForm(
  expense: Expense | undefined,
  onSaved: () => void,
) {
  const ledger = useLedger();
  const [draft, setDraft] = useState<ExpenseDraft>(() => {
    const now = new Date();
    return {
      name: expense?.name ?? '',
      category: expense?.category ?? 'inventory',
      subcategory: expense?.subcategory ?? 'vegetables',
      amount: expense ? (expense.amountPaise / 100).toFixed(2) : '',
      date: expense?.date ?? dateKey(now),
      time:
        expense?.time ??
        `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes(),
        ).padStart(2, '0')}`,
      vendor: expense?.vendor ?? '',
      payment: expense ? expense.payment : 'upi',
      notes: expense?.notes ?? '',
      receipt: expense?.receipt,
    };
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const update = <K extends keyof ExpenseDraft>(
    key: K,
    value: ExpenseDraft[K],
  ) => {
    setError('');
    setDraft(current => ({
      ...current,
      [key]: value,
      ...(key === 'category' && current.category !== value
        ? { subcategory: '' }
        : {}),
    }));
  };
  const validation = validateExpenseDraft(draft);
  function submit() {
    if (pending.current) return;
    setSubmitted(true);
    if (Object.values(validation).some(Boolean)) return;
    pending.current = true;
    Keyboard.dismiss();
    try {
      const { amount, ...values } = draft;
      ledger.save(
        {
          ...values,
          name: values.name.trim(),
          vendor: values.vendor.trim(),
          notes: values.notes.trim(),
          amountPaise: parseAmount(amount)!,
        },
        expense?.id,
      );
      onSaved();
    } catch (cause) {
      setError(ledgerError(cause, 'ledger.saveFailed'));
      pending.current = false;
    }
  }
  return {
    draft,
    update,
    errors: submitted
      ? validation
      : {
          name: undefined,
          amount: undefined,
          date: undefined,
          time: undefined,
        },
    error,
    submit,
  };
}
