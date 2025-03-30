import React, { useState } from 'react';
import './App.css';
import Payment from './components/Payment';
import RideCard from './components/RideCard';
import Cart from './components/Cart';
import Calendar from './components/Calendar';
import TimeSlot from './components/TimeSlot';
import { format } from 'date-fns';
import Ticket from './components/Ticket';

interface Ride {
  id: string;
  name: string;
  description: string;
  price: number;
  availableSeats: number;
  departureTime: string;
  arrivalTime: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (time: Date) => {
    setSelectedTimeSlot(time);
  };

  const handleQuantityChange = (rideId: string, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === rideId);
      if (existingItem) {
        if (quantity === 0) {
          return prevItems.filter(item => item.id !== rideId);
        }
        return prevItems.map(item =>
          item.id === rideId
            ? { ...item, quantity }
            : item
        );
      }
      // Find the ride from the local rides data
      const ride = [
        {
          id: '1',
          name: 'VIP Cruise',
          description: 'Experience luxury with our VIP cruise package',
          price: 150,
          availableSeats: 10,
          departureTime: format(selectedTimeSlot || new Date(), 'HH:mm'),
          arrivalTime: format(new Date((selectedTimeSlot || new Date()).getTime() + 120 * 60 * 1000), 'HH:mm')
        },
        {
          id: '2',
          name: 'Regular Cruise',
          description: 'Enjoy a comfortable regular cruise experience',
          price: 75,
          availableSeats: 30,
          departureTime: format(selectedTimeSlot || new Date(), 'HH:mm'),
          arrivalTime: format(new Date((selectedTimeSlot || new Date()).getTime() + 90 * 60 * 1000), 'HH:mm')
        }
      ].find(r => r.id === rideId);

      if (ride) {
        return [...prevItems, {
          id: rideId,
          name: ride.name,
          quantity,
          price: ride.price
        }];
      }
      return prevItems;
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Please select at least one ride before proceeding to checkout.');
      return;
    }
    
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    
    if (totalAmount <= 0) {
      alert('Invalid cart total. Please try again.');
      return;
    }
    
    setCurrentStep(4);
  };

  const handlePaymentComplete = (paymentIntentId: string) => {
    // Create ticket with payment intent ID
    const createTicket = async () => {
      try {
        const response = await fetch('/api/payment/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await response.json();
        if (data.success) {
          setTicketId(data.ticket._id);
          setCurrentStep(5);
        }
      } catch (error) {
        console.error('Error creating ticket:', error);
      }
    };

    createTicket();
  };

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0);

    while (startTime < endTime) {
      slots.push(new Date(startTime));
      startTime.setHours(startTime.getHours() + 1);
    }

    return slots;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Boat Ticket Management System</h1>
      </header>

      <main className="booking-section">
        <div className="progress-indicator">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            Select Date
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            Choose Time
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            Select Rides
          </div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            Payment
          </div>
          <div className={`progress-step ${currentStep >= 5 ? 'active' : ''}`}>
            Ticket
          </div>
        </div>

        <div className="booking-content">
          {currentStep === 1 && (
            <div className="step-content">
              <h2>Select Date</h2>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
              {selectedDate && (
                <button
                  className="next-button"
                  onClick={() => setCurrentStep(2)}
                >
                  Next
                </button>
              )}
            </div>
          )}

          {currentStep === 2 && selectedDate && (
            <div className="step-content">
              <h2>Choose Time</h2>
              <div className="time-slots-grid">
                {generateTimeSlots(selectedDate).map((time, index) => (
                  <TimeSlot
                    key={index}
                    time={time}
                    isSelected={selectedTimeSlot?.getTime() === time.getTime()}
                    onSelect={handleTimeSlotSelect}
                  />
                ))}
              </div>
              {selectedTimeSlot && (
                <button
                  className="next-button"
                  onClick={() => setCurrentStep(3)}
                >
                  Next
                </button>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h2>Select Rides</h2>
              <div className="rides-grid">
                {[
                  {
                    id: '1',
                    name: 'VIP Cruise',
                    description: 'Experience luxury with our VIP cruise package',
                    price: 150,
                    availableSeats: 10,
                    departureTime: format(selectedTimeSlot || new Date(), 'HH:mm'),
                    arrivalTime: format(new Date((selectedTimeSlot || new Date()).getTime() + 120 * 60 * 1000), 'HH:mm')
                  },
                  {
                    id: '2',
                    name: 'Regular Cruise',
                    description: 'Enjoy a comfortable regular cruise experience',
                    price: 75,
                    availableSeats: 30,
                    departureTime: format(selectedTimeSlot || new Date(), 'HH:mm'),
                    arrivalTime: format(new Date((selectedTimeSlot || new Date()).getTime() + 90 * 60 * 1000), 'HH:mm')
                  }
                ].map(ride => (
                  <RideCard
                    key={ride.id}
                    {...ride}
                    quantity={cartItems.find(item => item.id === ride.id)?.quantity || 0}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
              <Cart
                items={cartItems}
                onQuantityChange={handleQuantityChange}
                onCheckout={handleCheckout}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content">
              <h2>Payment</h2>
              <Payment
                totalAmount={cartItems.reduce(
                  (total, item) => total + item.price * item.quantity,
                  0
                )}
                onPaymentComplete={handlePaymentComplete}
                onCancel={() => setCurrentStep(3)}
              />
            </div>
          )}

          {currentStep === 5 && ticketId && (
            <div className="step-content">
              <Ticket ticketId={ticketId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App; 