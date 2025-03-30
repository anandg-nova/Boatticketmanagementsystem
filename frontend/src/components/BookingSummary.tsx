import React from 'react';

interface BookingSummaryProps {
  selectedRide: {
    id: string;
    name: string;
    price: number;
    departureTime: string;
    quantity: number;
  } | null;
  selectedDate: Date | null;
  onProceed: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedRide,
  selectedDate,
  onProceed
}) => {
  if (!selectedRide || !selectedDate) return null;

  const totalAmount = selectedRide.price * selectedRide.quantity;

  return (
    <div className="booking-summary">
      <h3>Booking Summary</h3>
      <div className="summary-details">
        <div className="summary-item">
          <span className="label">Ride:</span>
          <span className="value">{selectedRide.name}</span>
        </div>
        <div className="summary-item">
          <span className="label">Date:</span>
          <span className="value">{selectedDate.toLocaleDateString()}</span>
        </div>
        <div className="summary-item">
          <span className="label">Time:</span>
          <span className="value">{selectedRide.departureTime}</span>
        </div>
        <div className="summary-item">
          <span className="label">Quantity:</span>
          <span className="value">{selectedRide.quantity} tickets</span>
        </div>
        <div className="summary-item">
          <span className="label">Price per ticket:</span>
          <span className="value">₹{selectedRide.price}</span>
        </div>
        <div className="summary-item total">
          <span className="label">Total Amount:</span>
          <span className="value">₹{totalAmount}</span>
        </div>
      </div>
      <button 
        className="proceed-button"
        onClick={onProceed}
        disabled={selectedRide.quantity === 0}
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default BookingSummary; 