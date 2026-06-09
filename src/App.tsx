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
import { AlertCircle } from 'lucide-react';
import AppHeader from './components/AppHeader';
import CalendarEventBar from './components/CalendarEventBar';
import type { Team, ScheduleEvent, AppConfig } from './types';
import EventDialog from './components/EventDialog';
import ConfirmDialog from './components/ConfirmDialog';
import LoginPage from './components/LoginPage';
import MemberCredentialsModal from './components/MemberCredentialsModal';
import { useAuth } from './hooks/useAuth';
import { useOperations } from './hooks/useOperations';
import { useToast } from './hooks/useToast';
import * as api from './services/api';
import { fromLocalDateString } from './utils/dateUtils';
import { combineDateAndTime } from './utils/eventDates';
import { toFullCalendarEvent, getEventDates } from './utils/calendarEvents';
import { attachMonthResizeHandles, consumeEventClickSuppression, suppressEventClickAfterResize } from './utils/monthEventResize';
import { getFullCalendarLocale } from './utils/fullCalendarLocale';
import { normalizeLanguage } from './i18n/languages';
import { generateId } from './utils/id';
import { UNASSIGNED_EVENT_COLORS } from './utils/colors';

function App() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, login, logout } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('17:00');
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const { addOperation } = useOperations();

  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [pendingDeleteEventId, setPendingDeleteEventId] = useState<string | null>(null);
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState<Team | null>(null);
  const [credentialsTeam, setCredentialsTeam] = useState<Team | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({ demoMode: false });
  const [calendarSoloTeamId, setCalendarSoloTeamId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

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
    api.fetchAppConfig()
      .then(setAppConfig)
      .catch((err) => console.error('Failed to load app config:', err));
  }, []);

  useEffect(() => {
    if (!user) return;

    api.setOperationHandler(addOperation);
    const loadData = async () => {
      try {
        const [loadedTeams, loadedEvents] = await Promise.all([
          api.fetchTeams(),
          api.fetchEvents(),
        ]);
        setTeams(loadedTeams);
        setEvents(loadedEvents);
      } catch (err) {
        console.error('Failed to load data:', err);
        showToast(i18n.t('notifications.loadError'), 'error');
      }
    };
    loadData();
  }, [user, addOperation, showToast, i18n]);

  const handleAddTeam = async (payload: { id: string; name: string }) => {
    try {
      const created = await api.createTeam(payload);
      setTeams((prev) => [...prev, created]);
      showToast(t('notifications.teamAdded'), 'success');
    } catch (err) {
      console.error('Failed to add team:', err);
      showToast(t('notifications.teamAddError'), 'error');
    }
  };

  const handleSaveCredentials = async (data: {
    username: string;
    password?: string;
    role: 'admin' | 'member';
    listed: boolean;
  }) => {
    if (!credentialsTeam) return;
    try {
      const updated = await api.updateMemberCredentials(credentialsTeam.id, data);
      setTeams((prev) => prev.map((team) => (team.id === updated.id ? updated : team)));
      showToast(t('auth.credentialsSaved'), 'success');
    } catch (err) {
      console.error('Failed to save credentials:', err);
      showToast(t('auth.credentialsSaveError'), 'error');
      throw err;
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await api.deleteTeam(teamId);
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

  const calendarEvents = useMemo(() => {
    const visible = calendarSoloTeamId
      ? events.filter((event) => event.employeeId === calendarSoloTeamId)
      : events;
    return visible.map(toFullCalendarEvent);
  }, [events, calendarSoloTeamId]);

  const handleToggleCalendarSolo = useCallback((teamId: string) => {
    setCalendarSoloTeamId((current) => (current === teamId ? null : teamId));
  }, []);

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

      const colors = team.colors ?? UNASSIGNED_EVENT_COLORS;

      const event: ScheduleEvent = {
        id: generateId(),
        title: team.name,
        start,
        end,
        employeeId: team.id,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
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

  const openEventForEdit = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      setEditingEvent(event);
      setEventStartTime(event.start.toTimeString().slice(0, 5));
      setEventEndTime(event.end.toTimeString().slice(0, 5));
      setEventDescription(event.description || '');
    },
    [events]
  );

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (!isAdmin) return;
    if (consumeEventClickSuppression()) return;
    openEventForEdit(clickInfo.event.id);
  };

  const handleOpenEventEdit = useCallback(
    (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      openEventForEdit(eventId);
    },
    [openEventForEdit]
  );

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

  const handleQuickDelete = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPendingDeleteEventId(eventId);
  }, []);

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
      suppressEventClickAfterResize();
      await persistEventMove(resizeInfo, dates);
    },
    [persistEventMove]
  );

  const handleEventDidMount = useCallback(
    (info: EventMountArg) => {
      if (!isAdmin) return;
      const cleanup = attachMonthResizeHandles(info, (eventId, start, end) => {
        void persistEventDates(eventId, { start, end });
      });
      if (cleanup) {
        (info.el as HTMLElement & { _teamcalResizeCleanup?: () => void })._teamcalResizeCleanup =
          cleanup;
      }
    },
    [isAdmin, persistEventDates]
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
      const description = scheduleEvent?.description?.trim() ?? '';

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
        <CalendarEventBar
          eventInfo={eventInfo}
          memberName={team?.name}
          description={description}
          startStr={startStr}
          endStr={endStr}
          readOnly={!isAdmin}
          onDelete={handleQuickDelete}
          onEdit={handleOpenEventEdit}
        />
      );
    },
    [events, teams, timeLocale, use12HourClock, isAdmin, handleQuickDelete, handleOpenEventEdit]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        {t('auth.signingIn')}
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={login}
        demoAdmin={appConfig.demoMode ? appConfig.demoAdmin : undefined}
        demoMembers={appConfig.demoMode ? appConfig.demoMembers : undefined}
        demoMemberPassword={appConfig.demoMode ? appConfig.demoMemberPassword : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
          <AppHeader
            isAdmin={isAdmin}
            userRole={user.role}
            teams={teams}
            selectedTeam={selectedTeam}
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            onStartChange={setDefaultStart}
            onEndChange={setDefaultEnd}
            onAddTeam={handleAddTeam}
            onSelectTeam={setSelectedTeam}
            onRemoveTeam={(teamId) => {
              const team = teams.find((t) => t.id === teamId);
              if (team) setPendingDeleteTeam(team);
            }}
            onManageMember={setCredentialsTeam}
            onPrint={handlePrint}
            onLogout={() => void logout()}
            demoMode={appConfig.demoMode}
            calendarSoloTeamId={calendarSoloTeamId}
            onToggleCalendarSolo={handleToggleCalendarSolo}
          />

          {isAdmin && showSelectionWarning && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
              <AlertCircle size={20} />
              <span>{t('warnings.selectTeam')}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print-calendar">
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
            editable={isAdmin}
            eventStartEditable={isAdmin}
            eventDurationEditable={isAdmin}
            eventResizableFromStart={isAdmin}
            selectable={isAdmin && !!selectedTeam}
            selectMirror={isAdmin}
            dayMaxEvents={true}
            eventDisplay="block"
            weekends={true}
            events={calendarEvents}
            select={isAdmin ? handleDateSelect : undefined}
            eventClick={handleEventClick}
            eventDrop={isAdmin ? handleEventDrop : undefined}
            eventResize={isAdmin ? handleEventResize : undefined}
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
        memberName={teams.find((t) => t.id === editingEvent?.employeeId)?.name}
        memberColors={teams.find((t) => t.id === editingEvent?.employeeId)?.colors ?? undefined}
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

      <MemberCredentialsModal
        team={credentialsTeam}
        isOpen={credentialsTeam !== null}
        onClose={() => setCredentialsTeam(null)}
        onSave={handleSaveCredentials}
      />

      <ConfirmDialog
        isOpen={pendingDeleteTeam !== null}
        title={t('auth.deleteMemberConfirmTitle')}
        message={
          pendingDeleteTeam
            ? t('auth.deleteMemberConfirmMessage', { name: pendingDeleteTeam.name })
            : ''
        }
        onCancel={() => setPendingDeleteTeam(null)}
        onConfirm={() => {
          if (pendingDeleteTeam) {
            void handleRemoveTeam(pendingDeleteTeam.id);
          }
          setPendingDeleteTeam(null);
        }}
      />

      <ConfirmDialog
        isOpen={pendingDeleteEventId !== null}
        title={t('eventDialog.deleteConfirmTitle')}
        message={t('eventDialog.deleteConfirmMessage')}
        onCancel={() => setPendingDeleteEventId(null)}
        onConfirm={() => {
          if (pendingDeleteEventId) {
            void handleDeleteEvent(pendingDeleteEventId);
          }
          setPendingDeleteEventId(null);
        }}
      />
    </div>
  );
}

export default App;
