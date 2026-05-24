import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Team, UserRole } from '../types';

interface Props {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    username: string;
    password?: string;
    role: UserRole;
    listed: boolean;
  }) => Promise<void>;
}

export default function MemberCredentialsModal({ team, isOpen, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [listed, setListed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team && isOpen) {
      setUsername(team.username ?? team.name);
      setPassword('');
      setRole(team.role ?? 'member');
      setListed(team.listed);
      setError(null);
    }
  }, [team, isOpen]);

  if (!isOpen || !team) return null;

  const isNewCredentials = !team.hasCredentials;
  const showPasswordReminder = isNewCredentials || password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewCredentials && !password) {
      setError(t('auth.passwordRequired'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSave({
        username: username.trim(),
        ...(password ? { password } : {}),
        role,
        listed,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{t('auth.memberAccessTitle')}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('auth.memberAccessSubtitle', { name: team.name })}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="member-username" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.username')}
            </label>
            <input
              id="member-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="member-password" className="block text-sm font-medium text-gray-700 mb-1">
              {isNewCredentials ? t('auth.password') : t('auth.newPassword')}
            </label>
            <input
              id="member-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNewCredentials ? undefined : t('auth.passwordKeepCurrent')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isNewCredentials}
            />
          </div>

          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.role')}
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="member">{t('auth.roleMember')}</option>
              <option value="admin">{t('auth.roleAdmin')}</option>
            </select>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="member-listed"
              type="checkbox"
              checked={listed}
              onChange={(e) => setListed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="member-listed" className="block text-sm font-medium text-gray-700">
                {t('auth.listAsMember')}
              </label>
              <p className="text-xs text-gray-500 mt-0.5">{t('auth.listAsMemberHint')}</p>
            </div>
          </div>

          {showPasswordReminder && (
            <p className="text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">
              {t('auth.communicatePasswordReminder')}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {t('buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
