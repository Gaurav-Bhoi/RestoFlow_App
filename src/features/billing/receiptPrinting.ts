import RNPrint from 'react-native-print';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import type { ApiBill } from '../../api/types';
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        character
      ] ?? character),
  );
export function createReceiptHtml(
  restaurant: string,
  bill: ApiBill,
  issuedAt: Date,
) {
  const rows = bill.items
    .map(
      line =>
        `<tr><td>${escapeHtml(line.name)}</td><td>${
          line.quantity
        }</td><td>${formatCurrency(line.unitPrice)}</td><td>${formatCurrency(
          line.lineTotal,
        )}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:12px sans-serif;color:#22352d;max-width:320px;margin:24px auto}h1{text-align:center;font-size:20px}p{text-align:center}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:8px 0;text-align:right;border-bottom:1px solid #ddd}td:first-child,th:first-child{text-align:left}.total{text-align:right;border-top:1px dashed #aaa;padding-top:14px;font-size:18px}</style></head><body><h1>${escapeHtml(
    restaurant,
  )}</h1><p>${escapeHtml(bill.table.name)} · ${escapeHtml(
    bill.customerName ?? '',
  )}</p><p>${formatDate(issuedAt)} · ${issuedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total bill <strong>${formatCurrency(
    bill.total,
  )}</strong></p><p>Thank you for dining with us.<br>We hope to see you again.</p></body></html>`;
}
export const printCustomerReceipt = (
  restaurant: string,
  bill: ApiBill,
  issuedAt: Date,
) =>
  RNPrint.print({
    html: createReceiptHtml(restaurant, bill, issuedAt),
    jobName: `${restaurant} - ${bill.customerName ?? bill.orderId}`,
  });
