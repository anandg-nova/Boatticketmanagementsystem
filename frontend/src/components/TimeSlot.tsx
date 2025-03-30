import React from 'react';
import { format } from 'date-fns';
import './TimeSlot.css';

interface TimeSlotProps {
  time: Date;
  isSelected: boolean;
  isAvailable?: boolean;
  onSelect: (time: Date) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  time,
  isSelected,
  isAvailable = true,
  onSelect
}) => {
  return (
    <button
      className={`time-slot ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
      onClick={() => isAvailable && onSelect(time)}
      disabled={!isAvailable}
    >
      {format(time, 'hh:mm a')}
    </button>
  );
};

export default TimeSlot; 