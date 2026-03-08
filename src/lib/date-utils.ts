// All dates in IST (India Standard Time)
const IST_OFFSET = 5.5 * 60; // minutes

export function nowIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET * 60000);
}

export function toIST(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET * 60000);
}

export function todayIST(): string {
  const ist = nowIST();
  return formatDateIST(ist);
}

export function formatDateIST(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTimeIST(timestamp: number): string {
  const date = new Date(timestamp);
  const ist = toIST(date);
  const hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

export function formatDateReadable(timestamp: number): string {
  const date = new Date(timestamp);
  const ist = toIST(date);
  const today = nowIST();

  if (formatDateIST(ist) === formatDateIST(today)) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (formatDateIST(ist) === formatDateIST(yesterday)) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${ist.getDate()} ${months[ist.getMonth()]}`;
}

export function getMealTypeFromTime(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const ist = nowIST();
  const hour = ist.getHours();
  if (hour >= 6 && hour < 10) return 'breakfast';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 19 && hour < 22) return 'dinner';
  return 'snack';
}

export function getGreeting(): string {
  const ist = nowIST();
  const hour = ist.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function startOfDayIST(dateStr: string): number {
  // dateStr format: YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  // Create date at midnight IST
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  // Adjust for IST offset (subtract 5.5 hours to get UTC equivalent of midnight IST)
  return date.getTime() - IST_OFFSET * 60000;
}

export function endOfDayIST(dateStr: string): number {
  return startOfDayIST(dateStr) + 24 * 60 * 60 * 1000 - 1;
}
