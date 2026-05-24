import type { EventApi } from '@fullcalendar/core';
import type { ScheduleEvent } from '../types';

/** Map app events to FullCalendar's expected shape with stable extendedProps. */
export function toFullCalendarEvent(event: ScheduleEvent) {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor,
    borderColor: event.borderColor,
    textColor: event.textColor,
    allDay: event.allDay ?? false,
    extendedProps: {
      employeeId: event.employeeId,
      description: event.description ?? '',
    },
  };
}

export function getEventDates(event: EventApi): { start: Date; end: Date } | null {
  if (!event.start || !event.end) {
    return null;
  }
  return {
    start: new Date(event.start),
    end: new Date(event.end),
  };
}

export function getEventDescription(event: EventApi, scheduleEvents: ScheduleEvent[]): string {
  const fromExtended = event.extendedProps?.description;
  if (typeof fromExtended === 'string' && fromExtended.length > 0) {
    return fromExtended;
  }
  return scheduleEvents.find((e) => e.id === event.id)?.description ?? '';
}
