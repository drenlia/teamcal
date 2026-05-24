import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventResizeDoneArg,
  EventContentArg,
  EventMountArg,
} from '@fullcalendar/core';
import { AlertCircle, Printer, X } from 'lucide-react';
import type { Team, ScheduleEvent } from './types';
import TeamForm from './components/TeamForm';
import TeamList from './components/TeamList';
import EventDialog from './components/EventDialog';
import TimeSettings from './components/TimeSettings';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useOperations } from './hooks/useOperations';
import { useToast } from './hooks/useToast';
import * as api from './services/api';
import { fromLocalDateString } from './utils/dateUtils';
import { combineDateAndTime } from './utils/eventDates';
import { toFullCalendarEvent, getEventDates } from './utils/calendarEvents';
import { attachMonthResizeHandles } from './utils/monthEventResize';
import { getFullCalendarLocale } from './utils/fullCalendarLocale';
import { normalizeLanguage } from './i18n/languages';
import { generateId } from './utils/id';

function App() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('17:00');
  const [usedColors, setUsedColors] = useState<Set<number>>(new Set());
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const { addOperation } = useOperations();

  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const calendarLocale = useMemo(
    () => getFullCalendarLocale(i18n.language),
    [i18n.language]
  );

  const timeLocale = useMemo(() => {
    const lang = normalizeLanguage(i18n.language);
    if (lang === 'pt') return 'pt-BR';
    if (lang === 'fr') return 'fr-FR';
    return 'en-US';
  }, [i18n.language]);

  const use12HourClock = normalizeLanguage(i18n.language) === 'en';

  useEffect(() => {
    api.setOperationHandler(addOperation);
    const loadData = async () => {
      try {
        const [loadedTeams, loadedEvents] = await Promise.all([
          api.fetchTeams(),
          api.fetchEvents(),
        ]);
        setTeams(loadedTeams);
        setEvents(loadedEvents);
        setUsedColors(new Set(loadedTeams.map((team) => team.colorIndex)));
      } catch (err) {
        console.error('Failed to load data:', err);
        showToast(i18n.t('notifications.loadError'), 'error');
      }
    };
    loadData();
  }, [addOperation, showToast, i18n]);

  const handleAddTeam = async (team: Team) => {
    try {
      await api.createTeam(team);
      setTeams((prev) => [...prev, team]);
      setUsedColors((prev) => new Set([...prev, team.colorIndex]));
      showToast(t('notifications.teamAdded'), 'success');
    } catch (err) {
      console.error('Failed to add team:', err);
      showToast(t('notifications.teamAddError'), 'error');
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await api.deleteTeam(teamId);
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setUsedColors((prev) => {
          const newSet = new Set(prev);
          newSet.delete(team.colorIndex);
          return newSet;
        });
      }
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setEvents((prev) => prev.filter((event) => event.employeeId !== teamId));
      if (selectedTeam === teamId) {
        setSelectedTeam('');
      }
      showToast(t('notifications.teamRemoved'), 'success');
    } catch (err) {
      console.error('Failed to remove team:', err);
      showToast(t('notifications.teamRemoveError'), 'error');
    }
  };

  const setTimeOnDate = (date: Date, timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const calendarEvents = useMemo(
    () => events.map(toFullCalendarEvent),
    [events]
  );

  const handleDateSelect = useCallback(
    async (selectInfo: DateSelectArg) => {
      if (!selectedTeam) {
        setShowSelectionWarning(true);
        setTimeout(() => setShowSelectionWarning(false), 3000);
        selectInfo.view.calendar.unselect();
        return;
      }

      const team = teams.find((t) => t.id === selectedTeam);
      if (!team) return;

      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect();

      let start = selectInfo.start;
      let end = selectInfo.end;

      if (selectInfo.view.type === 'dayGridMonth') {
        start = setTimeOnDate(start, defaultStart);
        const lastDay = new Date(end);
        lastDay.setDate(lastDay.getDate() - 1);
        end = setTimeOnDate(lastDay, defaultEnd);
      }

      const event: ScheduleEvent = {
        id: generateId(),
        title: team.name,
        start,
        end,
        employeeId: team.id,
        backgroundColor: team.colors.bg,
        borderColor: team.colors.border,
        textColor: team.colors.text,
        allDay: false,
      };

      try {
        await api.createEvent(event);
        setEvents((prev) => [...prev, event]);
        showToast(t('notifications.eventAdded'), 'success');
      } catch (err) {
        console.error('Failed to create event:', err);
        showToast(t('notifications.eventAddError'), 'error');
      }
    },
    [selectedTeam, teams, defaultStart, defaultEnd, showToast, t]
  );

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (!event) return;

    setEditingEvent(event);
    setEventStartTime(event.start.toTimeString().slice(0, 5));
    setEventEndTime(event.end.toTimeString().slice(0, 5));
    setEventDescription(event.description || '');
  };

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        await api.deleteEvent(eventId);
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (editingEvent?.id === eventId) {
          setEditingEvent(null);
          setEventDescription('');
        }
        showToast(t('notifications.eventRemoved'), 'success');
      } catch (err) {
        console.error('Failed to remove event:', err);
        showToast(t('notifications.eventRemoveError'), 'error');
      }
    },
    [editingEvent, showToast, t]
  );

  const handleQuickDelete = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (window.confirm(t('eventDialog.deleteConfirmMessage'))) {
        void handleDeleteEvent(eventId);
      }
    },
    [handleDeleteEvent, t]
  );

  const handleStartDateChange = (dateStr: string) => {
    if (!editingEvent) return;
    const newDate = fromLocalDateString(dateStr, eventStartTime);
    setEditingEvent((prev) =>
      prev
        ? {
            ...prev,
            start: newDate,
          }
        : null
    );
  };

  const handleEndDateChange = (dateStr: string) => {
    if (!editingEvent) return;
    const newDate = fromLocalDateString(dateStr, eventEndTime);
    setEditingEvent((prev) =>
      prev
        ? {
            ...prev,
            end: newDate,
          }
        : null
    );
  };

  const handleSaveEventTime = async () => {
    if (!editingEvent) return;

    const newStart = combineDateAndTime(editingEvent.start, eventStartTime);
    const newEnd = combineDateAndTime(editingEvent.end, eventEndTime);

    try {
      await api.updateEvent(editingEvent.id, {
        start: newStart,
        end: newEnd,
        description: eventDescription,
      });

      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEvent.id
            ? { ...event, start: newStart, end: newEnd, description: eventDescription }
            : event
        )
      );

      setEditingEvent(null);
      setEventDescription('');
      showToast(t('notifications.eventUpdated'), 'success');
    } catch (err) {
      console.error('Failed to update event:', err);
      showToast(t('notifications.eventUpdateError'), 'error');
    }
  };

  const persistEventDates = useCallback(
    async (
      eventId: string,
      dates: { start: Date; end: Date },
      revert?: () => void
    ) => {
      const previous = events.find((e) => e.id === eventId);
      const description = previous?.description ?? '';

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, start: dates.start, end: dates.end } : e
        )
      );

      try {
        await api.updateEvent(eventId, {
          start: dates.start,
          end: dates.end,
          description,
        });
      } catch (err) {
        console.error('Failed to update event:', err);
        if (previous) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, start: previous.start, end: previous.end }
                : e
            )
          );
        }
        revert?.();
        showToast(t('notifications.eventUpdateError'), 'error');
      }
    },
    [events, showToast, t]
  );

  const persistEventMove = useCallback(
    async (
      changeInfo: EventDropArg | EventResizeDoneArg,
      dates: { start: Date; end: Date }
    ) => {
      const { event } = changeInfo;
      await persistEventDates(event.id, dates, () => changeInfo.revert());
    },
    [persistEventDates]
  );

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const dates = getEventDates(dropInfo.event);
      if (!dates) {
        dropInfo.revert();
        return;
      }
      await persistEventMove(dropInfo, dates);
    },
    [persistEventMove]
  );

  const handleEventResize = useCallback(
    async (resizeInfo: EventResizeDoneArg) => {
      const dates = getEventDates(resizeInfo.event);
      if (!dates) {
        resizeInfo.revert();
        return;
      }
      await persistEventMove(resizeInfo, dates);
    },
    [persistEventMove]
  );

  const handleEventDidMount = useCallback(
    (info: EventMountArg) => {
      const cleanup = attachMonthResizeHandles(info, (eventId, start, end) => {
        void persistEventDates(eventId, { start, end });
      });
      if (cleanup) {
        (info.el as HTMLElement & { _teamcalResizeCleanup?: () => void })._teamcalResizeCleanup =
          cleanup;
      }
    },
    [persistEventDates]
  );

  const handleEventWillUnmount = useCallback((info: EventMountArg) => {
    const el = info.el as HTMLElement & { _teamcalResizeCleanup?: () => void };
    el._teamcalResizeCleanup?.();
    delete el._teamcalResizeCleanup;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const eventContent = useCallback(
    (eventInfo: EventContentArg) => {
      const scheduleEvent = events.find((e) => e.id === eventInfo.event.id);
      const employeeId =
        eventInfo.event.extendedProps.employeeId ?? scheduleEvent?.employeeId;
      const team = teams.find((t) => t.id === employeeId);
      const description = scheduleEvent?.description?.trim() || '?';

      const timeFormat: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: use12HourClock,
      };

      const startStr = eventInfo.event.start?.toLocaleTimeString(
        timeLocale,
        timeFormat
      );
      const endStr = eventInfo.event.end?.toLocaleTimeString(
        timeLocale,
        timeFormat
      );

      return (
        <div
          className="flex items-center w-full px-1 group/event"
          title={description}
        >
          <div className="flex-grow flex items-center min-w-0 pointer-events-none">
            <span className="font-bold mr-1 truncate">{team?.name}</span>
            {eventInfo.isStart && startStr && (
              <span className="truncate">{startStr}</span>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center gap-0.5 pointer-events-none">
            {eventInfo.isEnd && endStr}
          </div>
          {eventInfo.isEnd && (
            <button
              type="button"
              className="pointer-events-auto ml-0.5 p-0.5 rounded-full opacity-0 group-hover/event:opacity-100 hover:bg-white/90 transition-opacity shrink-0"
              title={t('eventDialog.delete')}
              aria-label={t('eventDialog.delete')}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleQuickDelete(eventInfo.event.id, e)}
            >
              <X size={12} className="text-red-600" />
            </button>
          )}
        </div>
      );
    },
    [events, teams, timeLocale, use12HourClock, handleQuickDelete, t]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm no-print">
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <TimeSettings
                  defaultStart={defaultStart}
                  defaultEnd={defaultEnd}
                  onStartChange={setDefaultStart}
                  onEndChange={setDefaultEnd}
                />
                <LanguageSwitcher />
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Printer size={20} />
                  <span>{t('buttons.print')}</span>
                </button>
              </div>
            </div>
            <TeamForm onAddTeam={handleAddTeam} usedColors={usedColors} />
          </div>

          <TeamList
            teams={teams}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            onRemoveTeam={handleRemoveTeam}
          />

          {showSelectionWarning && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
              <AlertCircle size={20} />
              <span>{t('warnings.selectTeam')}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm print-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale={calendarLocale}
            buttonText={{
              today: t('calendar.today'),
              month: t('calendar.month'),
              week: t('calendar.week'),
              day: t('calendar.day'),
            }}
            editable={true}
            eventStartEditable={true}
            eventDurationEditable={true}
            eventResizableFromStart={true}
            selectable={!!selectedTeam}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={calendarEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            slotMinTime={defaultStart + ':00'}
            slotMaxTime={defaultEnd + ':00'}
            allDaySlot={false}
            expandRows={true}
            height="auto"
            eventContent={eventContent}
            eventDidMount={handleEventDidMount}
            eventWillUnmount={handleEventWillUnmount}
            timeZone="local"
          />
        </div>
      </div>

      <EventDialog
        isOpen={!!editingEvent}
        startTime={eventStartTime}
        endTime={eventEndTime}
        event={editingEvent}
        description={eventDescription}
        onDescriptionChange={setEventDescription}
        onStartChange={setEventStartTime}
        onEndChange={setEventEndTime}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onClose={() => {
          setEditingEvent(null);
          setEventDescription('');
        }}
        onSave={handleSaveEventTime}
        onDelete={() => editingEvent && void handleDeleteEvent(editingEvent.id)}
      />
    </div>
  );
}

export default App;
