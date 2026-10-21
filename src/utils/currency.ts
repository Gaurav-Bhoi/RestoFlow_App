export function formatCurrency(amount: number | string) {
  if (typeof amount === 'number')
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (!/^\d+\.\d{2}$/.test(amount)) throw new Error('Invalid monetary amount.');
  const [whole, fraction] = amount.split('.');
  return `₹${BigInt(whole).toLocaleString('en-IN')}${
    fraction === '00' ? '' : `.${fraction}`
  }`;
}
