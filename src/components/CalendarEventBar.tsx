import React from 'react';
import Tippy from '@tippyjs/react';
import type { EventContentArg } from '@fullcalendar/core';
import { MessageSquare, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'tippy.js/dist/tippy.css';

interface CalendarEventBarProps {
  eventInfo: EventContentArg;
  memberName?: string;
  description: string;
  startStr?: string;
  endStr?: string;
  readOnly?: boolean;
  onDelete: (eventId: string, e: React.MouseEvent) => void;
  onEdit: (eventId: string, e: React.MouseEvent) => void;
}

export default function CalendarEventBar({
  eventInfo,
  memberName,
  description,
  startStr,
  endStr,
  readOnly = false,
  onDelete,
  onEdit,
}: CalendarEventBarProps) {
  const { t } = useTranslation();
  const showDescriptionIcon = Boolean(description) && eventInfo.isStart;

  return (
    <div className="flex items-center w-full min-w-0 max-w-full overflow-hidden px-1 gap-1 group/event">
      <div className="flex flex-1 items-center min-w-0 gap-1 overflow-hidden">
        {memberName && (
          <span className="font-bold min-w-0 overflow-hidden whitespace-nowrap text-clip">
            {memberName}
          </span>
        )}
        {eventInfo.isStart && startStr && (
          <span className="text-xs shrink-0 tabular-nums whitespace-nowrap">
            {startStr}
          </span>
        )}
        {showDescriptionIcon && (
          <Tippy
            content={description}
            placement="top"
            delay={[200, 0]}
            maxWidth={280}
            interactive={false}
            touch={false}
          >
            <button
              type="button"
              className="pointer-events-auto shrink-0 p-0.5 rounded hover:bg-white/40 transition-colors"
              aria-label={t('eventDialog.viewDescription')}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                if (readOnly) {
                  e.stopPropagation();
                  return;
                }
                onEdit(eventInfo.event.id, e);
              }}
            >
              <MessageSquare size={12} className="opacity-90" />
            </button>
          </Tippy>
        )}
      </div>

      <div className="flex items-center shrink-0 gap-0.5 ml-auto">
        {eventInfo.isEnd && endStr && (
          <span className="text-xs tabular-nums whitespace-nowrap pointer-events-none">
            {endStr}
          </span>
        )}
        {!readOnly && eventInfo.isEnd && (
          <button
            type="button"
            className="pointer-events-auto p-0.5 rounded-full opacity-0 group-hover/event:opacity-100 hover:bg-white/90 transition-opacity shrink-0"
            title={t('eventDialog.delete')}
            aria-label={t('eventDialog.delete')}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => onDelete(eventInfo.event.id, e)}
          >
            <X size={12} className="text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
