import React from 'react';
import '../styles/RideCard.css';

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
}) => {
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(0, Math.min(availableSeats, quantity + change));
    onQuantityChange(id, newQuantity);
  };

  return (
    <div className={`ride-card ${availableSeats === 0 ? 'unavailable' : ''}`}>
      <div className="ride-header">
        <h3>{name}</h3>
        <span className="price">₹{price}</span>
      </div>
      <p className="description">{description}</p>
      <div className="ride-details">
        <div className="detail">
          <span className="label">Available Seats:</span>
          <span className="value">{availableSeats}</span>
        </div>
        <div className="detail">
          <span className="label">Departure:</span>
          <span className="value">{departureTime}</span>
        </div>
        <div className="detail">
          <span className="label">Arrival:</span>
          <span className="value">{arrivalTime}</span>
        </div>
      </div>
      {availableSeats > 0 && (
        <div className="quantity-controls">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity === 0}
            className="quantity-btn"
          >
            -
          </button>
          <span className="quantity">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= availableSeats}
            className="quantity-btn"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default RideCard; 