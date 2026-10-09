import RNPrint from 'react-native-print';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import type { CustomerOrder } from '../restaurant/types';
import { calculateOrderTotal, orderLines } from '../orders/orderCalculations';

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
  tableId: number,
  order: CustomerOrder,
  issuedAt: Date,
) {
  const rows = orderLines(order.items)
    .map(
      line =>
        `<tr><td>${escapeHtml(line.dish.name)}</td><td>${
          line.quantity
        }</td><td>${formatCurrency(line.dish.price)}</td><td>${formatCurrency(
          line.amount,
        )}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:12px sans-serif;color:#22352d;max-width:320px;margin:24px auto}h1{text-align:center;font-size:20px}p{text-align:center}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:8px 0;text-align:right;border-bottom:1px solid #ddd}td:first-child,th:first-child{text-align:left}.total{text-align:right;border-top:1px dashed #aaa;padding-top:14px;font-size:18px}</style></head><body><h1>${escapeHtml(
    restaurant,
  )}</h1><p>Table ${tableId} · ${escapeHtml(order.name)}</p><p>${formatDate(
    issuedAt,
  )} · ${issuedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total bill <strong>${formatCurrency(
    calculateOrderTotal(order.items),
  )}</strong></p><p>Taxes & charges: ₹0</p><p>Thank you for dining with us.<br>We hope to see you again.</p></body></html>`;
}
export const printCustomerReceipt = (
  restaurant: string,
  tableId: number,
  order: CustomerOrder,
  issuedAt: Date,
) =>
  RNPrint.print({
    html: createReceiptHtml(restaurant, tableId, order, issuedAt),
    jobName: `${restaurant} - ${order.name}`,
  });
