import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import TimeInput from './TimeInput';
import { SHIFT_PRESETS, type ShiftPreset } from '../constants/shiftPresets';
import { isEndAfterStart, type TimeValue } from '../utils/timeParts';

export type { ShiftPreset };

interface TimeRangeInputProps {
  start: TimeValue;
  end: TimeValue;
  onStartChange: (value: TimeValue) => void;
  onEndChange: (value: TimeValue) => void;
  /** Show quick-shift preset chips (default shift times in header). */
  showPresets?: boolean;
  /** Validate that end is after start (same-day comparison). */
  validateOrder?: boolean;
  compact?: boolean;
}

export default function TimeRangeInput({
  start,
  end,
  onStartChange,
  onEndChange,
  showPresets = true,
  validateOrder = true,
  compact = false,
}: TimeRangeInputProps) {
  const { t } = useTranslation();
  const orderInvalid = validateOrder && !isEndAfterStart(start, end);

  const applyPreset = (preset: ShiftPreset) => {
    onStartChange(preset.start);
    onEndChange(preset.end);
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {showPresets && (
        <div className="flex flex-wrap gap-1.5">
          {SHIFT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                start === preset.start && end === preset.end
                  ? 'bg-blue-100 border-blue-400 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              {t(`timeInput.presets.${preset.id}`)}
            </button>
          ))}
        </div>
      )}

      <div
        className={`flex items-center gap-2 ${compact ? 'flex-wrap' : 'flex-wrap sm:flex-nowrap'}`}
      >
        <Clock
          size={compact ? 18 : 20}
          className="text-gray-500 shrink-0 hidden sm:block"
          aria-hidden
        />
        <div className="flex items-center gap-2 flex-wrap">
          <TimeInput
            value={start}
            onChange={onStartChange}
            label={t('timeInput.start')}
          />
          <span className="text-sm text-gray-500 px-0.5">{t('timeSettings.to')}</span>
          <TimeInput value={end} onChange={onEndChange} label={t('timeInput.end')} />
        </div>
      </div>

      {orderInvalid && (
        <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg" role="alert">
          {t('timeInput.endBeforeStart')}
        </p>
      )}
    </div>
  );
}
