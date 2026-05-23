import type { TimeValue } from '../utils/timeParts';

export interface ShiftPreset {
  id: string;
  start: TimeValue;
  end: TimeValue;
}

export const SHIFT_PRESETS: ShiftPreset[] = [
  { id: 'day', start: '07:00', end: '15:00' },
  { id: 'standard', start: '09:00', end: '17:00' },
  { id: 'evening', start: '15:00', end: '23:00' },
  { id: 'night', start: '23:00', end: '07:00' },
];
