import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import type { Employee } from '../types';
import { EMPLOYEE_COLORS } from '../utils/colors';

interface Props {
  onAddEmployee: (employee: Employee) => void;
  usedColors: Set<number>;
}

export default function EmployeeForm({ onAddEmployee, usedColors }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const availableIndices = Array.from(
        { length: EMPLOYEE_COLORS.length },
        (_, i) => i
      ).filter(i => !usedColors.has(i));

      const colorIndex = availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : Math.floor(Math.random() * EMPLOYEE_COLORS.length);

      const employee: Employee = {
        id: crypto.randomUUID(),
        name: name.trim(),
        colors: EMPLOYEE_COLORS[colorIndex],
        colorIndex
      };
      
      onAddEmployee(employee);
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('addEmployee.placeholder')}
        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <PlusCircle size={20} />
        {t('addEmployee.button')}
      </button>
    </form>
  );
}