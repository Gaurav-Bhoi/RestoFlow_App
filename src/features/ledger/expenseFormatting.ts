import { formatCurrency } from '../../utils/currency';
import { localDate } from './expenseCalculations';

export const expenseMoney = (paise: number) =>
  formatCurrency((paise / 100).toFixed(2));
export const expenseDate = (date: string, language = 'en-IN') =>
  localDate(date).toLocaleDateString(language === 'en' ? 'en-IN' : language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
export function expenseTime(time: string, language = 'en-IN') {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(language, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
