import React from 'react';
import Tippy from '@tippyjs/react';
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: IconButtonProps) {
  const colorClass =
    variant === 'danger'
      ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-white';

  return (
    <Tippy content={label} placement="bottom" delay={[300, 0]}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`p-2 rounded-lg transition-colors ${colorClass}`}
      >
        <Icon size={18} aria-hidden />
      </button>
    </Tippy>
  );
}
