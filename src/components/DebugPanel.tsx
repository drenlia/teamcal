import React from 'react';
import { Terminal } from 'lucide-react';

interface Operation {
  id: string;
  type: 'query' | 'insert' | 'update' | 'delete';
  description: string;
  status: 'success' | 'error';
  timestamp: Date;
  error?: string;
}

interface Props {
  operations: Operation[];
}

export default function DebugPanel({ operations }: Props) {
  if (operations.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 font-mono text-sm max-h-48 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <Terminal size={16} />
        <h3 className="font-semibold">Database Operations</h3>
      </div>
      <div className="space-y-1">
        {operations.map(op => (
          <div
            key={op.id}
            className={`flex items-start gap-2 ${
              op.status === 'error' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            <span className="opacity-50">
              {op.timestamp.toLocaleTimeString()}
            </span>
            <span className="uppercase text-xs font-bold opacity-75">
              {op.type}
            </span>
            <span>{op.description}</span>
            {op.error && (
              <span className="text-red-400 ml-2">Error: {op.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}