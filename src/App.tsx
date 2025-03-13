import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, AlertCircle, Printer } from 'lucide-react';
import type { Team, ScheduleEvent } from './types';
import TeamForm from './components/TeamForm';
import TeamList from './components/TeamList';
import EventDialog from './components/EventDialog';
import TimeSettings from './components/TimeSettings';
import EventContent from './components/EventContent';
import LanguageToggle from './components/LanguageToggle';
import DebugPanel from './components/DebugPanel';
import { useOperations } from './hooks/useOperations';
import * as api from './services/api';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { toLocalDateString, fromLocalDateString } from './utils/dateUtils';

function App() {
  const { t, i18n } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('17:00');
  const [usedColors, setUsedColors] = useState<Set<number>>(new Set());
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { operations, addOperation } = useOperations();
  
  // Event editing state
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  useEffect(() => {
    api.setOperationHandler(addOperation);
    const loadData = async () => {
      try {
        const [loadedTeams, loadedEvents] = await Promise.all([
          api.fetchTeams(),
          api.fetchEvents()
        ]);
        setTeams(loadedTeams);
        setEvents(loadedEvents);
        setUsedColors(new Set(loadedTeams.map(team => team.colorIndex)));
      } catch (err) {
        console.error('Failed to load data:', err);
        // Continue with empty state if data fails to load
      }
    };
    loadData();
  }, [addOperation]);

  const handleAddTeam = async (team: Team) => {
    try {
      await api.createTeam(team);
      setTeams(prev => [...prev, team]);
      setUsedColors(prev => new Set([...prev, team.colorIndex]));
      setError(null);
    } catch (err) {
      console.error('Failed to add team:', err);
      setError('Failed to add team. Please try again.');
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await api.deleteTeam(teamId);
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setUsedColors(prev => {
          const newSet = new Set(prev);
          newSet.delete(team.colorIndex);
          return newSet;
        });
      }
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setEvents(prev => prev.filter(event => event.employeeId !== teamId));
      if (selectedTeam === teamId) {
        setSelectedTeam('');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to remove team:', err);
      setError('Failed to remove team. Please try again.');
    }
  };

  const setTimeOnDate = (date: Date, timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const handleDateSelect = useCallback(async (selectInfo: any) => {
    if (!selectedTeam) {
      setShowSelectionWarning(true);
      setTimeout(() => setShowSelectionWarning(false), 3000);
      selectInfo.view.calendar.unselect();
      return;
    }

    const team = teams.find(t => t.id === selectedTeam);
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
      id: crypto.randomUUID(),
      title: team.name,
      start,
      end,
      employeeId: team.id,
      backgroundColor: team.colors.bg,
      borderColor: team.colors.border,
      textColor: team.colors.text,
      allDay: false
    };

    try {
      await api.createEvent(event);
      setEvents(prev => [...prev, event]);
      setError(null);
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Failed to create event. Please try again.');
    }
  }, [selectedTeam, teams, defaultStart, defaultEnd]);

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (!event) return;

    setEditingEvent(event);
    setEventStartTime(event.start.toTimeString().slice(0, 5));
    setEventEndTime(event.end.toTimeString().slice(0, 5));
    setEventDescription(event.description || '');
  };

  const handleRemoveEvent = async (eventId: string) => {
    try {
      await api.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setError(null);
    } catch (err) {
      console.error('Failed to remove event:', err);
      setError('Failed to remove event. Please try again.');
    }
  };

  const handleStartDateChange = (dateStr: string) => {
    if (!editingEvent) return;
    const newDate = fromLocalDateString(dateStr, eventStartTime);
    setEditingEvent(prev => prev ? {
      ...prev,
      start: newDate
    } : null);
  };

  const handleEndDateChange = (dateStr: string) => {
    if (!editingEvent) return;
    const newDate = fromLocalDateString(dateStr, eventEndTime);
    setEditingEvent(prev => prev ? {
      ...prev,
      end: newDate
    } : null);
  };

  const handleSaveEventTime = async () => {
    if (!editingEvent) return;

    // Create dates in local timezone
    const startDate = new Date(editingEvent.start.toLocaleDateString());
    const endDate = new Date(editingEvent.end.toLocaleDateString());
    
    // Set the times
    const [startHours, startMinutes] = eventStartTime.split(':');
    const [endHours, endMinutes] = eventEndTime.split(':');
    
    startDate.setHours(Number(startHours), Number(startMinutes));
    endDate.setHours(Number(endHours), Number(endMinutes));

    // Convert to UTC for saving
    const newStart = new Date(startDate.getTime());
    const newEnd = new Date(endDate.getTime());

    try {
      await api.updateEvent(editingEvent.id, { 
        start: newStart,
        end: newEnd,
        description: eventDescription 
      });
      
      setEvents(prev => prev.map(event =>
        event.id === editingEvent.id
          ? { ...event, start: newStart, end: newEnd, description: eventDescription }
          : event
      ));
      
      setEditingEvent(null);
      setEventDescription('');
      setError(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      setError('Failed to update event. Please try again.');
    }
  };

  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;
    try {
      await api.updateEvent(event.id, {
        start: new Date(event.start),
        end: new Date(event.end),
        description: event.extendedProps.description
      });
      setEvents(prev => prev.map(e =>
        e.id === event.id
          ? {
              ...e,
              start: new Date(event.start),
              end: new Date(event.end)
            }
          : e
      ));
      setError(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      dropInfo.revert();
      setError('Failed to update event. Please try again.');
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    const { event } = resizeInfo;
    try {
      await api.updateEvent(event.id, {
        start: new Date(event.start),
        end: new Date(event.end),
        description: event.extendedProps.description
      });
      setEvents(prev => prev.map(e =>
        e.id === event.id
          ? {
              ...e,
              start: new Date(event.start),
              end: new Date(event.end)
            }
          : e
      ));
      setError(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      resizeInfo.revert();
      setError('Failed to update event. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const eventContent = (eventInfo: any) => {
    const event = events.find(e => e.id === eventInfo.event.id);
    const team = teams.find(t => t.id === eventInfo.event.extendedProps.employeeId);
    
    // Get start and end times
    const startStr = eventInfo.event.start.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
    const endStr = eventInfo.event.end.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });

    // Check if this is the last segment of the event
    const isLastSegment = eventInfo.isEnd;
    // Check if this is the first segment of the event
    const isFirstSegment = eventInfo.isStart;
    
    return (
      <Tippy 
        content={event?.description || '?'}
        placement="top"
        theme="light-border"
        delay={[200, 0]}
      >
        <div className="flex items-center w-full px-1">
          <div className="flex-grow flex items-center">
            <span className="font-bold mr-1">{team?.name}</span>
            {isFirstSegment && <span>{startStr}</span>}
          </div>
          <div className="flex-shrink-0">
            {isLastSegment && endStr}
          </div>
        </div>
      </Tippy>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm no-print">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <TeamForm
                onAddTeam={handleAddTeam}
                usedColors={usedColors}
              />
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
            </div>
            <div className="flex items-center gap-6">
              <TimeSettings
                defaultStart={defaultStart}
                defaultEnd={defaultEnd}
                onStartChange={setDefaultStart}
                onEndChange={setDefaultEnd}
              />
              <LanguageToggle />
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer size={20} />
                <span>{t('buttons.print')}</span>
              </button>
            </div>
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
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale={i18n.language}
            buttonText={{
              today: t('calendar.today'),
              month: t('calendar.month'),
              week: t('calendar.week'),
              day: t('calendar.day')
            }}
            editable={true}
            selectable={!!selectedTeam}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
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
      />
{/*
      <DebugPanel operations={operations} />
*/}
    </div>
  );
}

export default App;
