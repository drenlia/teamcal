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
    assignedTo: 'Assigned to',
    start: 'Start',
    end: 'End',
    date: 'Date',
    quickShifts: 'Quick shift times',
    description: 'Description',
    viewDescription: 'View description',
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
  auth: {
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    signInSubtitle: 'Sign in to manage the team schedule',
    signOut: 'Sign out',
    username: 'Username',
    password: 'Password',
    newPassword: 'New password',
    role: 'Role',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    memberAccessTitle: 'Member login',
    memberAccessSubtitle: 'Set login credentials for {{name}}',
    communicatePasswordReminder:
      'Remember to share the username and password securely with this person after saving.',
    doubleClickToManage: 'Double-click to manage login and role',
    noLoginYet: 'No login',
    viewOnly: 'View only',
    credentialsSaved: 'Login credentials saved',
    credentialsSaveError: 'Failed to save credentials',
    listAsMember: 'List as member',
    listAsMemberHint: 'When off, this person is hidden from the member list (like admin).',
    notListed: 'Hidden from member list',
    passwordKeepCurrent: 'Leave blank to keep current password',
    passwordRequired: 'Password is required for new members',
    deleteMemberConfirmTitle: 'Remove this member?',
    deleteMemberConfirmMessage:
      '{{name}} will be removed from the schedule along with all their shifts. This cannot be undone.',
  },
  toolbar: {
    adminSubtitle: 'Manage members, shifts, and default hours',
    adminPanel: 'Default shift hours & member management',
  },
  demo: {
    resetCountdown: 'This demo will reset in {{minutes}}m {{seconds}}s',
    loginTitle: 'Demo admin login (prefilled below)',
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