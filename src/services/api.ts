import type { AuthUser, Team, ScheduleEvent, MemberCredentialsInput, AppConfig } from '../types';

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

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error || `HTTP error! status: ${response.status}`;
  } catch {
    return `HTTP error! status: ${response.status}`;
  }
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${input}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await apiFetch('/auth/me');
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const response = await apiFetch('/config');
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function fetchTeams(): Promise<Team[]> {
  try {
    const response = await apiFetch('/teams');
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    const data = await response.json();
    onOperation?.('query', 'Fetched all teams', 'success');
    return data;
  } catch (error) {
    onOperation?.('query', 'Failed to fetch teams', 'error', (error as Error).message);
    throw error;
  }
}

export async function fetchEvents(): Promise<ScheduleEvent[]> {
  try {
    const response = await apiFetch('/events');
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    const events = await response.json();
    onOperation?.('query', 'Fetched all events', 'success');
    return events.map((event: ScheduleEvent & { start: string; end: string }) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  } catch (error) {
    onOperation?.('query', 'Failed to fetch events', 'error', (error as Error).message);
    throw error;
  }
}

export async function createTeam(team: Pick<Team, 'id' | 'name'>): Promise<Team> {
  try {
    const response = await apiFetch('/teams', {
      method: 'POST',
      body: JSON.stringify({ id: team.id, name: team.name }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    const created = await response.json();
    onOperation?.('insert', `Created team: ${team.name}`, 'success');
    return created;
  } catch (error) {
    onOperation?.('insert', `Failed to create team: ${team.name}`, 'error', (error as Error).message);
    throw error;
  }
}

export async function updateMemberCredentials(
  teamId: string,
  data: MemberCredentialsInput
): Promise<Team> {
  const response = await apiFetch(`/teams/${teamId}/credentials`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function deleteTeam(teamId: string): Promise<void> {
  try {
    const response = await apiFetch(`/teams/${teamId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    onOperation?.('delete', `Deleted team: ${teamId}`, 'success');
  } catch (error) {
    onOperation?.('delete', `Failed to delete team: ${teamId}`, 'error', (error as Error).message);
    throw error;
  }
}

export async function createEvent(event: ScheduleEvent): Promise<void> {
  try {
    const response = await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    onOperation?.('insert', `Created event: ${event.title}`, 'success');
  } catch (error) {
    onOperation?.('insert', `Failed to create event: ${event.title}`, 'error', (error as Error).message);
    throw error;
  }
}

export async function updateEvent(
  eventId: string,
  data: { start: Date; end: Date; description?: string }
): Promise<void> {
  try {
    const response = await apiFetch(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify({
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        description: data.description,
      }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    onOperation?.('update', `Updated event: ${eventId}`, 'success');
  } catch (error) {
    onOperation?.('update', `Failed to update event: ${eventId}`, 'error', (error as Error).message);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const response = await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    onOperation?.('delete', `Deleted event: ${eventId}`, 'success');
  } catch (error) {
    onOperation?.('delete', `Failed to delete event: ${eventId}`, 'error', (error as Error).message);
    throw error;
  }
}
