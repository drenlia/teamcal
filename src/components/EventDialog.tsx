import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { SHIFT_PRESETS } from '../constants/shiftPresets';
import { ScheduleEvent } from '../types';
import { isEndAfterStart } from '../utils/timeParts';
import TimeInput from './TimeInput';

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
  onDelete: () => void;
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
  onSave,
  onDelete,
}: EventDialogProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sameDay = useMemo(() => {
    if (!event) return false;
    return event.start.toDateString() === event.end.toDateString();
  }, [event]);

  if (!isOpen || !event) return null;

  const dateInputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{t('eventDialog.title')}</h3>

        {confirmDelete ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900">
              {t('eventDialog.deleteConfirmTitle')}
            </p>
            <p className="text-sm text-gray-600">
              {t('eventDialog.deleteConfirmMessage')}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t('buttons.delete')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('eventDialog.quickShifts')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SHIFT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onStartChange(preset.start);
                        onEndChange(preset.end);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        startTime === preset.start && endTime === preset.end
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t(`timeInput.presets.${preset.id}`)}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-gray-700">
                  {t('eventDialog.start')}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">{t('eventDialog.date')}</label>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-500 shrink-0" aria-hidden />
                      <input
                        type="date"
                        value={toLocalDateInputValue(event.start)}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">{t('timeInput.start')}</label>
                    <TimeInput
                      value={startTime}
                      onChange={onStartChange}
                      label={t('timeInput.start')}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-gray-700">
                  {t('eventDialog.end')}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">{t('eventDialog.date')}</label>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-500 shrink-0" aria-hidden />
                      <input
                        type="date"
                        value={toLocalDateInputValue(event.end)}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">{t('timeInput.end')}</label>
                    <TimeInput
                      value={endTime}
                      onChange={onEndChange}
                      label={t('timeInput.end')}
                    />
                  </div>
                </div>
              </fieldset>

              {sameDay && !isEndAfterStart(startTime, endTime) && (
                <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg" role="alert">
                  {t('timeInput.endBeforeStart')}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventDialog.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={t('eventDialog.descriptionPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              >
                {t('eventDialog.delete')}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={sameDay && !isEndAfterStart(startTime, endTime)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('buttons.save')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
