export const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
export const isValidPhone = (phone: string) =>
  /^[6-9]\d{9}$/.test(normalizePhone(phone));

export function toE164Phone(input: string) {
  const phone = normalizePhone(input);
  const local =
    phone.length === 12 && phone.startsWith('91') ? phone.slice(2) : phone;
  if (!isValidPhone(local))
    throw new Error('Enter a valid 10-digit Indian mobile number.');
  return `+91${local}`;
}
