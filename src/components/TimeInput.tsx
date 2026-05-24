import React, { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatTime,
  from12HourParts,
  parseTime,
  snapMinutes,
  to12HourParts,
  type TimeValue,
} from '../utils/timeParts';

const MINUTE_STEP = 5;

interface TimeInputProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function buildMinuteOptions(): number[] {
  const options: number[] = [];
  for (let m = 0; m < 60; m += MINUTE_STEP) {
    options.push(m);
  }
  return options;
}

function buildHourOptions24(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

function buildHourOptions12(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

export default function TimeInput({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: TimeInputProps) {
  const { i18n, t } = useTranslation();
  const id = useId();
  const use24Hour = !i18n.language.startsWith('en');

  const parsed = useMemo(() => parseTime(value) ?? { hours: 9, minutes: 0 }, [value]);
  const minutes = snapMinutes(parsed.minutes, MINUTE_STEP);
  const minuteOptions = useMemo(() => buildMinuteOptions(), []);

  const selectClass =
    'px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500';

  const emit = (hours: number, mins: number) => {
    onChange(formatTime(hours, snapMinutes(mins, MINUTE_STEP)));
  };

  if (use24Hour) {
    return (
      <div className={className}>
        {label && (
          <span id={id} className="sr-only">
            {label}
          </span>
        )}
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-labelledby={label ? id : undefined}
        >
          <select
            aria-label={label ? `${label}, ${t('timeInput.hour')}` : t('timeInput.hour')}
            className={selectClass}
            disabled={disabled}
            value={parsed.hours}
            onChange={(e) => emit(Number(e.target.value), minutes)}
          >
            {buildHourOptions24().map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-gray-500 font-medium" aria-hidden>
            :
          </span>
          <select
            aria-label={label ? `${label}, ${t('timeInput.minute')}` : t('timeInput.minute')}
            className={selectClass}
            disabled={disabled}
            value={minutes}
            onChange={(e) => emit(parsed.hours, Number(e.target.value))}
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const { hour12, period } = to12HourParts(parsed.hours);

  return (
    <div className={className}>
      {label && (
        <span id={id} className="sr-only">
          {label}
        </span>
      )}
      <div
        className="flex items-center gap-1.5 flex-wrap"
        role="group"
        aria-labelledby={label ? id : undefined}
      >
        <select
          aria-label={label ? `${label}, ${t('timeInput.hour')}` : t('timeInput.hour')}
          className={selectClass}
          disabled={disabled}
          value={hour12}
          onChange={(e) =>
            emit(from12HourParts(Number(e.target.value), period), minutes)
          }
        >
          {buildHourOptions12().map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-gray-500 font-medium" aria-hidden>
          :
        </span>
        <select
          aria-label={label ? `${label}, ${t('timeInput.minute')}` : t('timeInput.minute')}
          className={selectClass}
          disabled={disabled}
          value={minutes}
          onChange={(e) =>
            emit(from12HourParts(hour12, period), Number(e.target.value))
          }
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select
          aria-label={label ? `${label}, ${t('timeInput.period')}` : t('timeInput.period')}
          className={selectClass}
          disabled={disabled}
          value={period}
          onChange={(e) =>
            emit(
              from12HourParts(hour12, e.target.value as 'AM' | 'PM'),
              minutes
            )
          }
        >
          <option value="AM">{t('timeInput.am')}</option>
          <option value="PM">{t('timeInput.pm')}</option>
        </select>
      </div>
    </div>
  );
}
