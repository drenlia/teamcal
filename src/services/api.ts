import type { Team, ScheduleEvent } from '../types';

const API_URL = '/api';

let onOperation: ((
  type: 'query' | 'insert' | 'update' | 'delete',
  description: string,
  status: 'success' | 'error',
  error?: string
) => void) | null = null;

export function setOperationHandler(handler: typeof onOperation) {
  onOperation = handler;
}

export async function fetchTeams(): Promise<Team[]> {
  try {
    const response = await fetch(`${API_URL}/teams`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    onOperation?.('query', 'Fetched all teams', 'success');
    return data;
  } catch (error) {
    onOperation?.('query', 'Failed to fetch teams', 'error', error.message);
    throw error;
  }
}

export async function fetchEvents(): Promise<ScheduleEvent[]> {
  try {
    const response = await fetch(`${API_URL}/events`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const events = await response.json();
    onOperation?.('query', 'Fetched all events', 'success');
    return events.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }));
  } catch (error) {
    onOperation?.('query', 'Failed to fetch events', 'error', error.message);
    throw error;
  }
}

export async function createTeam(team: Team): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: team.id,
        name: team.name,
        colorIndex: team.colorIndex,
        colors: team.colors
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    onOperation?.('insert', `Created team: ${team.name}`, 'success');
  } catch (error) {
    onOperation?.('insert', `Failed to create team: ${team.name}`, 'error', error.message);
    throw error;
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/teams/${teamId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    onOperation?.('delete', `Deleted team: ${teamId}`, 'success');
  } catch (error) {
    onOperation?.('delete', `Failed to delete team: ${teamId}`, 'error', error.message);
    throw error;
  }
}

export async function createEvent(event: ScheduleEvent): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString()
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    onOperation?.('insert', `Created event: ${event.title}`, 'success');
  } catch (error) {
    onOperation?.('insert', `Failed to create event: ${event.title}`, 'error', error.message);
    throw error;
  }
}

export async function updateEvent(
  eventId: string, 
  data: { start: Date; end: Date; description?: string }
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        description: data.description
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    onOperation?.('update', `Updated event: ${eventId}`, 'success');
  } catch (error) {
    onOperation?.('update', `Failed to update event: ${eventId}`, 'error', error.message);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    onOperation?.('delete', `Deleted event: ${eventId}`, 'success');
  } catch (error) {
    onOperation?.('delete', `Failed to delete event: ${eventId}`, 'error', error.message);
    throw error;
  }
}
