import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSession } from '../auth/SessionProvider';
import { isExpense, readExpenses, writeExpenses } from './expenseStorage';
import type { Expense } from './types';

interface LedgerState {
  expenses: Expense[];
  error: string;
  reload: () => void;
  save: (expense: Omit<Expense, 'id'>, id?: string) => void;
  remove: (id: string) => void;
  notice: string;
  dismissNotice: () => void;
}
const LedgerContext = createContext<LedgerState | null>(null);

export function LedgerProvider({ children }: React.PropsWithChildren) {
  const { session } = useSession();
  const account = session?.role === 'owner' ? session.restaurantId : undefined;
  // Remounting prevents a previous restaurant's data or feedback leaking into another account.
  return (
    <RestaurantLedger key={account ?? 'unavailable'} restaurantId={account}>
      {children}
    </RestaurantLedger>
  );
}

function RestaurantLedger({
  restaurantId,
  children,
}: React.PropsWithChildren<{ restaurantId?: string }>) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const current = useRef<Expense[]>([]);
  const reload = useCallback(() => {
    try {
      const stored = restaurantId ? readExpenses(restaurantId) : [];
      current.current = stored;
      setExpenses(stored);
      setError('');
    } catch {
      setError('ledger.loadFailed');
    }
  }, [restaurantId]);
  useEffect(reload, [reload]);
  const dismissNotice = useCallback(() => setNotice(''), []);
  function commit(updated: Expense[], message: string) {
    if (!restaurantId || error) throw new Error('ledger.saveFailed');
    try {
      writeExpenses(restaurantId, updated);
    } catch {
      throw new Error('ledger.saveFailed');
    }
    current.current = updated;
    setExpenses(updated);
    setNotice(message);
  }
  function save(value: Omit<Expense, 'id'>, id?: string) {
    if (id && !current.current.some(expense => expense.id === id))
      throw new Error('ledger.notFound');
    const expense = {
      ...value,
      id:
        id ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
    };
    if (!isExpense(expense)) throw new Error('ledger.invalidExpense');
    const updated = id
      ? current.current.map(item => (item.id === id ? expense : item))
      : [expense, ...current.current];
    commit(updated, id ? 'ledger.expenseUpdated' : 'ledger.expenseSaved');
  }
  function remove(id: string) {
    if (!current.current.some(expense => expense.id === id))
      throw new Error('ledger.notFound');
    commit(
      current.current.filter(expense => expense.id !== id),
      'ledger.expenseDeleted',
    );
  }
  return (
    <LedgerContext.Provider
      value={{ expenses, error, reload, save, remove, notice, dismissNotice }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ledger = useContext(LedgerContext);
  if (!ledger) throw new Error('LedgerProvider is required');
  return ledger;
}
