import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, KeyRound, EyeOff, X } from 'lucide-react';
import type { Team } from '../types';

interface Props {
  teams: Team[];
  selectedTeam: string;
  calendarSoloTeamId: string | null;
  isAdmin: boolean;
  readOnly?: boolean;
  onSelectTeam: (id: string) => void;
  onRemoveTeam: (id: string) => void;
  onManageMember: (team: Team) => void;
  onToggleCalendarSolo: (id: string) => void;
}

const PENDING_STYLE = {
  backgroundColor: '#F3F4F6',
  color: '#6B7280',
  borderColor: '#D1D5DB',
};

export default function TeamList({
  teams,
  selectedTeam,
  calendarSoloTeamId,
  isAdmin,
  readOnly = false,
  onSelectTeam,
  onRemoveTeam,
  onManageMember,
  onToggleCalendarSolo,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {calendarSoloTeamId && (
        <p className="text-xs text-gray-500">
          {t('calendar.filterActive')}{' '}
          <button
            type="button"
            onClick={() => onToggleCalendarSolo(calendarSoloTeamId)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {t('calendar.showAllMembers')}
          </button>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {teams.map((team) => {
          const hasColors = team.colors != null;
          const chipStyle = hasColors
            ? {
                backgroundColor: team.colors!.bg,
                color: team.colors!.text,
                borderColor: team.colors!.border,
              }
            : PENDING_STYLE;
          const isSolo = calendarSoloTeamId === team.id;
          const isHiddenByFilter =
            calendarSoloTeamId != null && calendarSoloTeamId !== team.id;

          return (
            <div
              key={team.id}
              className={`
                group flex items-center rounded-lg border-2 transition-all
                ${team.id === selectedTeam
                  ? 'border-current shadow-md scale-105'
                  : 'border-transparent hover:border-current hover:shadow-sm'
                }
                ${!hasColors ? 'border-dashed' : ''}
                ${!team.listed ? 'opacity-75' : ''}
                ${isHiddenByFilter ? 'opacity-40' : ''}
              `}
              style={chipStyle}
            >
              {hasColors && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCalendarSolo(team.id);
                  }}
                  title={
                    isSolo ? t('calendar.showAllMembers') : t('calendar.showOnlyMember')
                  }
                  aria-label={
                    isSolo ? t('calendar.showAllMembers') : t('calendar.showOnlyMember')
                  }
                  aria-pressed={isSolo}
                  className={`
                    pl-2 py-2 rounded-l-md transition-opacity shrink-0
                    ${isSolo ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
                  `}
                >
                  <Eye size={14} aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectTeam(team.id)}
                onDoubleClick={() => {
                  if (isAdmin) onManageMember(team);
                }}
                title={isAdmin ? t('auth.doubleClickToManage') : undefined}
                className="flex items-center gap-2 px-3 py-2 flex-1 min-w-0"
              >
                {!readOnly && !team.hasCredentials && (
                  <KeyRound size={14} className="opacity-70 shrink-0" aria-hidden />
                )}
                {!readOnly && team.hasCredentials && !team.listed && (
                  <EyeOff
                    size={14}
                    className="opacity-70 shrink-0"
                    title={t('auth.notListed')}
                    aria-label={t('auth.notListed')}
                  />
                )}
                <span className="font-medium">{team.name}</span>
                {!readOnly && !team.hasCredentials && (
                  <span className="text-xs opacity-75">{t('auth.noLoginYet')}</span>
                )}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTeam(team.id);
                  }}
                  className="pr-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shrink-0"
                  aria-label={t('buttons.delete')}
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
