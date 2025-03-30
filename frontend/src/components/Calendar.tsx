import React from 'react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import './Calendar.css';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h3>Select Date</h3>
        <p className="date-range">
          {format(today, 'MMM d')} - {format(next7Days[6], 'MMM d, yyyy')}
        </p>
      </div>
      <div className="calendar-days">
        {next7Days.map((day, index) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const dayName = format(day, 'EEE');
          const date = format(day, 'd');

          return (
            <div
              key={index}
              className={`calendar-day ${isSelected ? 'selected' : ''} 
                         ${isToday ? 'today' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <span className="day-name">{dayName}</span>
              <span className="day-date">{date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar; 