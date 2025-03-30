import React from 'react';
import './RideCard.css';

interface RideCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  availableSeats: number;
  departureTime: string;
  arrivalTime: string;
  quantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
  isSelected?: boolean;
}

const RideCard: React.FC<RideCardProps> = ({
  id,
  name,
  description,
  price,
  availableSeats,
  departureTime,
  arrivalTime,
  quantity,
  onQuantityChange,
  isSelected = false
}) => {
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(0, Math.min(availableSeats, quantity + change));
    onQuantityChange(id, newQuantity);
  };

  return (
    <div className={`ride-card ${isSelected ? 'selected' : ''} ${availableSeats === 0 ? 'unavailable' : ''}`}>
      <div className="ride-header">
        <div className="ride-title">
          <h3>{name}</h3>
          <span className="ride-type">{name.includes('VIP') ? 'VIP' : 'Regular'}</span>
        </div>
        <span className="price">₹{price}</span>
      </div>
      <div className="ride-details">
        <p>{description}</p>
      </div>
      <div className="ride-info">
        <span>Available Seats: {availableSeats}</span>
        <span>Departure: {departureTime}</span>
        <span>Arrival: {arrivalTime}</span>
      </div>
      {availableSeats > 0 && (
        <div className="quantity-controls">
          <button 
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 0}
            className="quantity-btn"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="quantity">{quantity}</span>
          <button 
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= availableSeats}
            className="quantity-btn"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default RideCard; 