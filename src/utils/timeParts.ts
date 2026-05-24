/** Time string in 24-hour HH:mm format. */
export type TimeValue = string;

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

export function parseTime(value: TimeValue): { hours: number; minutes: number } | null {
  const match = value.match(TIME_RE);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatTime(hours: number, minutes: number): TimeValue {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function snapMinutes(minutes: number, step: number): number {
  return Math.min(59, Math.round(minutes / step) * step);
}

export function to12HourParts(hours24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return { hour12, period };
}

export function from12HourParts(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function formatTimeDisplay(value: TimeValue, use24Hour: boolean): string {
  const parsed = parseTime(value);
  if (!parsed) return value;
  if (use24Hour) {
    return formatTime(parsed.hours, parsed.minutes);
  }
  const { hour12, period } = to12HourParts(parsed.hours);
  return `${hour12}:${String(parsed.minutes).padStart(2, '0')} ${period}`;
}

/** Minutes from midnight for comparing times on the same day. */
export function timeToMinutes(value: TimeValue): number | null {
  const parsed = parseTime(value);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

export function isEndAfterStart(start: TimeValue, end: TimeValue): boolean {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) return true;
  return endMin > startMin;
}
