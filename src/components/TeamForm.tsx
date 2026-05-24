import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import { generateId } from '../utils/id';

interface Props {
  onAddTeam: (payload: { id: string; name: string }) => void;
}

export default function TeamForm({ onAddTeam }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddTeam({ id: generateId(), name: name.trim() });
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('addTeam.placeholder')}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0"
      >
        <PlusCircle size={20} />
        {t('addTeam.button')}
      </button>
    </form>
  );
}
