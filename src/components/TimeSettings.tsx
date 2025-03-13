import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

interface Props {
  defaultStart: string;
  defaultEnd: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
}

export default function TimeSettings({ defaultStart, defaultEnd, onStartChange, onEndChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-gray-600" />
        <input
          type="time"
          value={defaultStart}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span>{t('timeSettings.to')}</span>
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-gray-600" />
        <input
          type="time"
          value={defaultEnd}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}