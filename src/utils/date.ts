export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
export function trialDaysRemaining(endsAt: string, now = new Date()) {
  return Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000),
  );
}
