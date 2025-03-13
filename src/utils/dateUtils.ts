export const toLocalDateString = (date: Date) => {
  const localDate = new Date(date);
  return localDate.toISOString().split('T')[0];
};

export const fromLocalDateString = (dateStr: string, timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date(dateStr);
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};

export const toLocalTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
}; 