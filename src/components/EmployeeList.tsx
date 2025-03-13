import React from 'react';
import { X } from 'lucide-react';
import type { Employee } from '../types';

interface Props {
  employees: Employee[];
  selectedEmployee: string;
  onSelectEmployee: (id: string) => void;
  onRemoveEmployee: (id: string) => void;
}

export default function EmployeeList({
  employees,
  selectedEmployee,
  onSelectEmployee,
  onRemoveEmployee
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {employees.map(employee => (
        <button
          key={employee.id}
          onClick={() => onSelectEmployee(employee.id)}
          className={`
            group flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
            ${employee.id === selectedEmployee
              ? 'border-current shadow-md scale-105'
              : 'border-transparent hover:border-current hover:shadow-sm'
            }
          `}
          style={{
            backgroundColor: employee.colors.bg,
            color: employee.colors.text
          }}
        >
          <span className="font-medium">{employee.name}</span>
          <X
            size={16}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveEmployee(employee.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
          />
        </button>
      ))}
    </div>
  );
}