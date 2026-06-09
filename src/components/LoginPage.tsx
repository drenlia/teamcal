import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface DemoAdmin {
  username: string;
  password: string;
}

interface DemoMember {
  name: string;
  username: string;
}

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string | null;
  demoAdmin?: DemoAdmin | null;
  demoMembers?: DemoMember[];
  demoMemberPassword?: string;
}

export default function LoginPage({
  onLogin,
  error,
  demoAdmin,
  demoMembers,
  demoMemberPassword,
}: Props) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (demoAdmin) {
      setUsername(demoAdmin.username);
      setPassword(demoAdmin.password);
    }
  }, [demoAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const prefillMember = (memberUsername: string) => {
    if (!demoMemberPassword) return;
    setUsername(memberUsername);
    setPassword(demoMemberPassword);
  };

  const displayError = localError || error;
  const isDemoLogin = Boolean(demoAdmin);
  const showDemoCard = demoAdmin || (demoMembers?.length && demoMemberPassword);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-sm text-gray-600 mb-6">{t('auth.signInSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.username')}
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type={isDemoLogin ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {displayError && (
              <p className="text-sm text-red-600" role="alert">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <LogIn size={18} />
              {submitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {showDemoCard && (
            <div className="mt-6 text-sm bg-gray-100 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 space-y-3">
              {demoAdmin && (
                <div>
                  <p className="font-medium text-gray-700">{t('demo.loginTitle')}</p>
                  <p className="mt-1">
                    {t('auth.username')}: <span className="font-mono">{demoAdmin.username}</span>
                  </p>
                  <p>
                    {t('auth.password')}: <span className="font-mono">{demoAdmin.password}</span>
                  </p>
                </div>
              )}

              {demoMembers?.length && demoMemberPassword && (
                <div className={demoAdmin ? 'pt-3 border-t border-gray-200' : undefined}>
                  <p className="font-medium text-gray-700">{t('demo.memberLoginTitle')}</p>
                  <p className="mt-1">{t('demo.memberLoginHint', { password: demoMemberPassword })}</p>
                  <ul className="mt-2 space-y-1">
                    {demoMembers.map((member) => (
                      <li key={member.username}>
                        <button
                          type="button"
                          onClick={() => prefillMember(member.username)}
                          className="text-left hover:text-gray-900 underline-offset-2 hover:underline"
                        >
                          <span className="font-medium">{member.name}</span>
                          {' '}
                          <span className="font-mono text-gray-500">({member.username})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
