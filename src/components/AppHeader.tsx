import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Printer } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import TimeSettings from './TimeSettings';
import TeamForm from './TeamForm';
import TeamList from './TeamList';
import IconButton from './IconButton';
import { useAdminPanelOpen } from '../hooks/useAdminPanelOpen';
import { useDemoCountdown } from '../hooks/useDemoCountdown';
import type { Team, UserRole } from '../types';
import type { TimeValue } from '../utils/timeParts';

interface AppHeaderProps {
  isAdmin: boolean;
  userRole: UserRole;
  teams: Team[];
  selectedTeam: string;
  defaultStart: TimeValue;
  defaultEnd: TimeValue;
  onStartChange: (time: TimeValue) => void;
  onEndChange: (time: TimeValue) => void;
  onAddTeam: (payload: { id: string; name: string }) => void;
  onSelectTeam: (id: string) => void;
  onRemoveTeam: (id: string) => void;
  onManageMember: (team: Team) => void;
  onPrint: () => void;
  onLogout: () => void;
  demoMode?: boolean;
  calendarSoloTeamId: string | null;
  onToggleCalendarSolo: (id: string) => void;
}

export default function AppHeader({
  isAdmin,
  userRole,
  teams,
  selectedTeam,
  defaultStart,
  defaultEnd,
  onStartChange,
  onEndChange,
  onAddTeam,
  onSelectTeam,
  onRemoveTeam,
  onManageMember,
  onPrint,
  onLogout,
  demoMode = false,
  calendarSoloTeamId,
  onToggleCalendarSolo,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const { adminPanelOpen, toggleAdminPanel } = useAdminPanelOpen();
  const { minutesUntilReset, secondsUntilReset } = useDemoCountdown(demoMode);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('title')}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                userRole === 'admin'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {t(userRole === 'admin' ? 'auth.roleAdmin' : 'auth.roleMember')}
            </span>
          </div>
          {isAdmin && (
            <p className="text-sm text-gray-500">{t('toolbar.adminSubtitle')}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <LanguageSwitcher />
          <div className="w-px h-5 bg-gray-200" aria-hidden />
          <div className="relative">
            {demoMode && (
              <div className="absolute -top-6 right-0 text-red-600 text-xs font-medium whitespace-nowrap">
                {t('demo.resetCountdown', {
                  minutes: minutesUntilReset,
                  seconds: secondsUntilReset,
                })}
              </div>
            )}
            <IconButton
              icon={Printer}
              label={t('buttons.print')}
              onClick={onPrint}
            />
          </div>
          <IconButton
            icon={LogOut}
            label={t('auth.signOut')}
            onClick={onLogout}
            variant="danger"
          />
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
          <button
            type="button"
            onClick={toggleAdminPanel}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-100/80 transition-colors"
            aria-expanded={adminPanelOpen}
          >
            <span className="text-sm font-medium text-gray-800">
              {t('toolbar.adminPanel')}
            </span>
            <ChevronDown
              size={18}
              className={`text-gray-500 shrink-0 transition-transform ${
                adminPanelOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </button>
          {adminPanelOpen && (
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-200">
              <TimeSettings
                defaultStart={defaultStart}
                defaultEnd={defaultEnd}
                onStartChange={onStartChange}
                onEndChange={onEndChange}
              />
              <TeamForm onAddTeam={onAddTeam} />
            </div>
          )}
        </div>
      )}

      <TeamList
        teams={teams}
        selectedTeam={selectedTeam}
        calendarSoloTeamId={calendarSoloTeamId}
        isAdmin={isAdmin}
        readOnly={!isAdmin}
        onSelectTeam={onSelectTeam}
        onRemoveTeam={onRemoveTeam}
        onManageMember={onManageMember}
        onToggleCalendarSolo={onToggleCalendarSolo}
      />
    </div>
  );
}
