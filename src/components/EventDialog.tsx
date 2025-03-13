import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar } from 'lucide-react';
import { ScheduleEvent } from '../types';
import { toLocalDateString } from '../utils/dateUtils';

interface EventDialogProps {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  event: ScheduleEvent | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const toLocalDateInputValue = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

export default function EventDialog({
  isOpen,
  startTime,
  endTime,
  event,
  description,
  onDescriptionChange,
  onStartChange,
  onEndChange,
  onStartDateChange,
  onEndDateChange,
  onClose,
  onSave
}: EventDialogProps) {
  const { t } = useTranslation();

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">{t('eventDialog.title')}</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t('eventDialog.start')}</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={20} className="text-gray-600" />
                <input
                  type="date"
                  value={event ? toLocalDateInputValue(event.start) : ''}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Clock size={20} className="text-gray-600" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => onStartChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t('eventDialog.end')}</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={20} className="text-gray-600" />
                <input
                  type="date"
                  value={event ? toLocalDateInputValue(event.end) : ''}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Clock size={20} className="text-gray-600" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => onEndChange(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('eventDialog.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder={t('eventDialog.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('buttons.cancel')}
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('buttons.save')}
          </button>
        </div>
      </div>
    </div>
  );
}