export interface TeamColors {
  bg: string;
  border: string;
  text: string;
}

export interface Team {
  id: string;
  name: string;
  colors: TeamColors;
  colorIndex: number;
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