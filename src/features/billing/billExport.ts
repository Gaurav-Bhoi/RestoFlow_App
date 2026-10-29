import type { CustomerBill } from '../../api/billing';
import type { CustomerBillPdfDocument } from '../ledger/ledgerFiles';
import { ledgerFiles } from '../ledger/ledgerFiles';
import { formatCurrency } from '../../utils/currency';
import type { TFunction } from 'i18next';

export function billPdfLabels(t: TFunction) {
  return {
    title: t('billing.customerBill'),
    item: t('billing.item'),
    qty: t('billing.qty'),
    price: t('billing.price'),
    amount: t('billing.amount'),
    subtotal: t('billing.subtotal'),
    taxes: t('billing.taxesCharges'),
    total: t('billing.grandTotal'),
    billNumber: (number: string) => t('billing.billNumber', { number }),
  };
}

export function billDate(bill: CustomerBill, language: string) {
  return new Date(bill.orderedAt).toLocaleDateString(
    language === 'mr' ? 'mr-IN' : 'en-IN',
    {
      timeZone: bill.timezone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
}
export function billTime(bill: CustomerBill, language: string) {
  return new Date(bill.orderedAt).toLocaleTimeString(
    language === 'mr' ? 'mr-IN' : 'en-IN',
    { timeZone: bill.timezone, hour: 'numeric', minute: '2-digit' },
  );
}
async function createBillPdf(
  bill: CustomerBill,
  labels: {
    title: string;
    item: string;
    qty: string;
    price: string;
    amount: string;
    subtotal: string;
    taxes: string;
    total: string;
    billNumber?: (number: string) => string;
  },
  language: string,
) {
  const document: CustomerBillPdfDocument = {
    layout: 'receipt',
    fileName: `${bill.restaurantName.trim()} bill ${billDate(bill, 'en')}.pdf`
      .replace(/[<>:"/\\|?*\p{Cc}]/gu, '_')
      .replace(/\s+/g, ' '),
    restaurant: bill.restaurantName.toLocaleUpperCase(),
    title: labels.title,
    period: [bill.table.name, bill.customerName].filter(Boolean).join(' · '),
    generated: `${billDate(bill, language)}${
      bill.billNumber
        ? ` · ${labels.billNumber?.(bill.billNumber) ?? bill.billNumber}`
        : ''
    }`,
    columns: [labels.item, labels.qty, labels.price, labels.amount],
    rows: bill.items.map(line => [
      line.name,
      String(line.quantity),
      formatCurrency(line.unitPrice),
      formatCurrency(line.lineTotal),
    ]),
    notes: bill.items.map(line => line.note ?? ''),
    totals: [
      [labels.taxes, formatCurrency(bill.taxesAndCharges)],
      [labels.total, formatCurrency(bill.total)],
    ],
  };
  const uri = await ledgerFiles.createPdf(document);
  return { uri, name: document.fileName };
}

export async function downloadBill(...args: Parameters<typeof createBillPdf>) {
  const { uri, name } = await createBillPdf(...args);
  return ledgerFiles.savePdf(uri, name);
}

export async function shareBill(
  bill: CustomerBill,
  labels: Parameters<typeof createBillPdf>[1],
  language: string,
  channel: 'WHATSAPP' | 'EMAIL',
) {
  const { uri, name } = await createBillPdf(bill, labels, language);
  await ledgerFiles.sharePdf(uri, name, channel.toLowerCase());
}
