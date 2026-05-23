import type { EventMountArg } from '@fullcalendar/core';
import { combineDateAndTime } from './eventDates';

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function dateFromDayCell(calendarEl: Element, clientX: number, clientY: number): Date | null {
  const days = calendarEl.querySelectorAll<HTMLElement>('.fc-daygrid-day[data-date]');
  for (const day of days) {
    const rect = day.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const dateStr = day.getAttribute('data-date');
      if (!dateStr) return null;
      const [year, month, dayNum] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, dayNum);
    }
  }
  return null;
}

export type MonthResizeComplete = (
  eventId: string,
  start: Date,
  end: Date
) => void;

/** FullCalendar disables resize for timed events in month view; wire custom edge handles. */
export function attachMonthResizeHandles(
  info: EventMountArg,
  onComplete: MonthResizeComplete
): () => void {
  if (info.view.type !== 'dayGridMonth' || info.event.allDay) {
    return () => undefined;
  }

  const calendarEl = info.el.closest('.fc');
  if (!calendarEl) return () => undefined;

  const cleanups: Array<() => void> = [];

  const addHandle = (edge: 'start' | 'end', className: string) => {
    const handle = document.createElement('div');
    handle.className = `teamcal-resize-handle ${className}`;
    handle.setAttribute('data-resize-edge', edge);
    handle.title = edge === 'start' ? 'Resize start' : 'Resize end';

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const event = info.event;
      const initialStart = event.start ? new Date(event.start) : null;
      const initialEnd = event.end ? new Date(event.end) : null;
      if (!initialStart || !initialEnd) return;

      document.body.classList.add('teamcal-resizing');

      const onMouseMove = (moveEvent: MouseEvent) => {
        const day = dateFromDayCell(calendarEl, moveEvent.clientX, moveEvent.clientY);
        if (!day) return;

        if (edge === 'start' && info.isStart) {
          const newStart = combineDateAndTime(day, formatTime(initialStart));
          if (newStart < initialEnd) {
            event.setDates(newStart, initialEnd);
          }
        } else if (edge === 'end' && info.isEnd) {
          const newEnd = combineDateAndTime(day, formatTime(initialEnd));
          if (newEnd > initialStart) {
            event.setDates(initialStart, newEnd);
          }
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.classList.remove('teamcal-resizing');

        if (event.start && event.end) {
          onComplete(event.id, new Date(event.start), new Date(event.end));
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
    info.el.appendChild(handle);
    cleanups.push(() => {
      handle.removeEventListener('mousedown', onMouseDown);
      handle.remove();
    });
  };

  if (info.isStart) {
    addHandle('start', 'teamcal-resize-handle-start');
  }
  if (info.isEnd) {
    addHandle('end', 'teamcal-resize-handle-end');
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
