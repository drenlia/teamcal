import { useState, useCallback } from 'react';

export interface Operation {
  id: string;
  type: 'query' | 'insert' | 'update' | 'delete';
  description: string;
  status: 'success' | 'error';
  timestamp: Date;
  error?: string;
}

export function useOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);

  const addOperation = useCallback((
    type: Operation['type'],
    description: string,
    status: Operation['status'],
    error?: string
  ) => {
    const operation: Operation = {
      id: crypto.randomUUID(),
      type,
      description,
      status,
      timestamp: new Date(),
      error
    };

    setOperations(prev => {
      const newOps = [...prev, operation];
      // Keep only last 50 operations
      if (newOps.length > 50) {
        return newOps.slice(-50);
      }
      return newOps;
    });
  }, []);

  return { operations, addOperation };
}