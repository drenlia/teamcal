import React from 'react';
import { X } from 'lucide-react';
import type { Team } from '../types';

interface Props {
  teams: Team[];
  selectedTeam: string;
  onSelectTeam: (id: string) => void;
  onRemoveTeam: (id: string) => void;
}

export default function TeamList({
  teams,
  selectedTeam,
  onSelectTeam,
  onRemoveTeam
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {teams.map(team => (
        <button
          key={team.id}
          onClick={() => onSelectTeam(team.id)}
          className={`
            group flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
            ${team.id === selectedTeam
              ? 'border-current shadow-md scale-105'
              : 'border-transparent hover:border-current hover:shadow-sm'
            }
          `}
          style={{
            backgroundColor: team.colors.bg,
            color: team.colors.text
          }}
        >
          <span className="font-medium">{team.name}</span>
          <X
            size={16}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTeam(team.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          />
        </button>
      ))}
    </div>
  );
}