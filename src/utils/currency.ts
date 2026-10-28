export function formatCurrency(amount: number | string) {
  if (typeof amount === 'number')
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (!/^\d+\.\d{2}$/.test(amount)) throw new Error('Invalid monetary amount.');
  const [whole, fraction] = amount.split('.');
  // Hermes does not consistently localize BigInt. Group the integer string
  // without converting monetary values through a floating point number.
  const digits = BigInt(whole).toString();
  const prefix = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = `${prefix ? `${prefix},` : ''}${digits.slice(-3)}`;
  return `₹${grouped}${fraction === '00' ? '' : `.${fraction}`}`;
}
