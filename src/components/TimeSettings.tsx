import React from 'react';
import { useTranslation } from 'react-i18next';
import TimeRangeInput from './TimeRangeInput';
import type { TimeValue } from '../utils/timeParts';

interface Props {
  defaultStart: TimeValue;
  defaultEnd: TimeValue;
  onStartChange: (time: TimeValue) => void;
  onEndChange: (time: TimeValue) => void;
}

export default function TimeSettings({
  defaultStart,
  defaultEnd,
  onStartChange,
  onEndChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {t('timeSettings.label')}
      </span>
      <TimeRangeInput
        start={defaultStart}
        end={defaultEnd}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        validateOrder={false}
        compact
      />
    </div>
  );
}
