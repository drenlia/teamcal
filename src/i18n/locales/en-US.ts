export const enUS = {
  title: 'Team Scheduler',
  addTeam: {
    placeholder: 'Enter member name',
    button: 'Add Member'
  },
  timeSettings: {
    to: 'to',
    label: 'Default shift hours'
  },
  timeInput: {
    hour: 'Hour',
    minute: 'Minute',
    period: 'AM/PM',
    am: 'AM',
    pm: 'PM',
    start: 'Start time',
    end: 'End time',
    endBeforeStart: 'End time should be after start time on the same day.',
    presets: {
      day: 'Day (7a–3p)',
      standard: 'Standard (9a–5p)',
      evening: 'Evening (3p–11p)',
      night: 'Night (11p–7a)'
    }
  },
  buttons: {
    print: 'Print Calendar',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
  },
  warnings: {
    selectTeam: 'Please select a team member before scheduling'
  },
  calendar: {
    today: 'today',
    month: 'Month',
    week: 'Week',
    day: 'Day'
  },
  eventDialog: {
    title: 'Edit Event Time',
    start: 'Start',
    end: 'End',
    date: 'Date',
    quickShifts: 'Quick shift times',
    description: 'Description',
    descriptionPlaceholder: 'Add event description...',
    delete: 'Delete shift',
    deleteConfirmTitle: 'Delete this shift?',
    deleteConfirmMessage:
      'This shift will be removed from the schedule. This cannot be undone.',
  },
  language: {
    label: 'Language',
    en: 'English',
    pt: 'Português',
    fr: 'Français',
  },
  notifications: {
    loadError: 'Could not load the schedule. Please refresh the page.',
    teamAdded: 'Team member added successfully',
    teamAddError: 'Failed to add team member',
    teamRemoved: 'Team member removed successfully',
    teamRemoveError: 'Failed to remove team member',
    eventAdded: 'Event added successfully',
    eventAddError: 'Failed to add event',
    eventRemoved: 'Event removed successfully',
    eventRemoveError: 'Failed to remove event',
    eventUpdated: 'Event updated successfully',
    eventUpdateError: 'Failed to update event'
  }
};