export type UserRole = 'admin' | 'member';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  teamId: string | null;
}

export interface TeamColors {
  bg: string;
  border: string;
  text: string;
}

export interface Team {
  id: string;
  name: string;
  colors: TeamColors | null;
  colorIndex: number | null;
  hasCredentials: boolean;
  username: string | null;
  role: UserRole | null;
  listed: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  employeeId: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  allDay?: boolean;
}

export interface MemberCredentialsInput {
  username: string;
  password?: string;
  role: UserRole;
  listed: boolean;
}

export interface AppConfig {
  demoMode: boolean;
  demoAdmin?: {
    username: string;
    password: string;
  };
}
