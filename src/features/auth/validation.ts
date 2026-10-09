export const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
export const isValidPhone = (phone: string) =>
  /^[6-9]\d{9}$/.test(normalizePhone(phone));
