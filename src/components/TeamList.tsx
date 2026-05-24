import React from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, EyeOff, X } from 'lucide-react';
import type { Team } from '../types';

interface Props {
  teams: Team[];
  selectedTeam: string;
  isAdmin: boolean;
  readOnly?: boolean;
  onSelectTeam: (id: string) => void;
  onRemoveTeam: (id: string) => void;
  onManageMember: (team: Team) => void;
}

const PENDING_STYLE = {
  backgroundColor: '#F3F4F6',
  color: '#6B7280',
  borderColor: '#D1D5DB',
};

export default function TeamList({
  teams,
  selectedTeam,
  isAdmin,
  readOnly = false,
  onSelectTeam,
  onRemoveTeam,
  onManageMember,
}: Props) {
  const { t } = useTranslation();

  return (
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

        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(team.id)}
            onDoubleClick={() => {
              if (isAdmin) onManageMember(team);
            }}
            title={isAdmin ? t('auth.doubleClickToManage') : undefined}
            className={`
              group flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
              ${team.id === selectedTeam
                ? 'border-current shadow-md scale-105'
                : 'border-transparent hover:border-current hover:shadow-sm'
              }
              ${!hasColors ? 'border-dashed' : ''}
              ${!team.listed ? 'opacity-75' : ''}
            `}
            style={chipStyle}
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
            {!readOnly && (
              <X
                size={16}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTeam(team.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
