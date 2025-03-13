import React from 'react';
import { X, GripVertical } from 'lucide-react';
import { EventContentArg } from '@fullcalendar/core';

interface Props {
  event: EventContentArg;
  onRemove: () => void;
}

export default function EventContent({ event, onRemove }: Props) {
  const isMonthView = event.view.type === 'dayGridMonth';
  const startTime = event.event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = event.event.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Check if event starts and ends on the same day
  const isSameDay = event.event.start && event.event.end && 
    event.event.start.toDateString() === event.event.end.toDateString();

  return (
    <div className={`w-full h-full group relative ${isMonthView ? 'py-0.5' : 'p-1'}`}>
      {isMonthView ? (
        <div className="flex items-center min-w-0 relative h-full">
          {/* Resize handles container - full height for better grip */}
          <div className="absolute inset-y-0 left-0 w-4 cursor-w-resize opacity-0 group-hover:opacity-100 flex items-center justify-start">
            {event.isStart && <GripVertical size={12} className="text-gray-400" />}
          </div>
          <div className="absolute inset-y-0 right-0 w-4 cursor-e-resize opacity-0 group-hover:opacity-100 flex items-center justify-end">
            {event.isEnd && <GripVertical size={12} className="text-gray-400" />}
          </div>

          {/* Main content with conditional layout */}
          {isMonthView && isSameDay ? (
            <div className="flex flex-col justify-center min-w-0 flex-1 px-4 mx-auto w-[60%]" style={{ cursor: 'move' }}>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 hover:bg-red-50 flex-shrink-0"
                >
                  <X size={12} className="text-red-500" />
                </button>
                <span className="font-medium truncate">{event.event.title}</span>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-75">
                <span>{startTime}</span>
                <span>-</span>
                <span>{endTime}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 px-4 mx-auto w-[60%]" style={{ cursor: 'move' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 hover:bg-red-50 flex-shrink-0"
              >
                <X size={12} className="text-red-500" />
              </button>
              <span className="font-medium truncate">{event.event.title}</span>
              {event.isStart && (
                <span className="text-xs opacity-75 whitespace-nowrap">{startTime}</span>
              )}
              {event.isEnd && (
                <span className="text-xs opacity-75 whitespace-nowrap ml-auto">{endTime}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 hover:bg-red-50"
          >
            <X size={14} className="text-red-500" />
          </button>
          <div className="font-medium">{event.event.title}</div>
          <div className="text-xs mt-0.5 opacity-75">
            {startTime} - {endTime}
          </div>
        </>
      )}
    </div>
  );
}
