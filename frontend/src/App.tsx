import React, { useState, useEffect } from 'react';
import './App.css';
import Payment from './components/Payment';
import RideCard from './components/RideCard';
import Cart from './components/Cart';
import Calendar from './components/Calendar';
import TimeSlot from './components/TimeSlot';
import { format } from 'date-fns';
import Ticket from './components/Ticket';
import RideManagerDashboard from './components/RideManagerDashboard';
import BookingsList from './components/BookingsList';
import './styles/BookingsList.css';
import axios from 'axios';

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
  const [view, setView] = useState<'landing' | 'booking' | 'rideManager' | 'bookings'>('landing');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (time: Date) => {
    setSelectedTimeSlot(time);
  };

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rides`);
        if (response.data.status === 'success') {
          setRides(response.data.data.rides);
        }
      } catch (err) {
        setError('Failed to fetch rides. Please try again later.');
        console.error('Error fetching rides:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

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
      const ride = [
        {
          id: '1',
          name: 'VIP Experience',
          description: 'Luxury cruise with premium amenities, gourmet refreshments, and personalized service',
          price: 150,
          availableSeats: 10,
          departureTime: selectedTimeSlot ? format(selectedTimeSlot, 'HH:mm') : '00:00',
          arrivalTime: selectedTimeSlot ? format(new Date(selectedTimeSlot.getTime() + 120 * 60 * 1000), 'HH:mm') : '00:00'
        },
        {
          id: '2',
          name: 'Regular Experience',
          description: 'Comfortable cruise with standard amenities and scenic views',
          price: 75,
          availableSeats: 30,
          departureTime: selectedTimeSlot ? format(selectedTimeSlot, 'HH:mm') : '00:00',
          arrivalTime: selectedTimeSlot ? format(new Date(selectedTimeSlot.getTime() + 90 * 60 * 1000), 'HH:mm') : '00:00'
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

  const handleNavigateToRideManager = () => {
    setView('rideManager');
  };

  const handleNavigateToBooking = () => {
    setView('booking');
  };

  if (view === 'landing') {
    return (
      <div className="landing-container">
        <header className="landing-header">
          <h1>Boat Ticket Management System</h1>
        </header>
        <main className="landing-content">
          <div className="navigation-options">
            <div className="nav-card" onClick={handleNavigateToBooking}>
              <h2>Book Tickets</h2>
              <p>Book your boat tickets for upcoming rides</p>
            </div>
            <div className="nav-card" onClick={handleNavigateToRideManager}>
              <h2>Ride Manager</h2>
              <p>Manage rides, validate tickets, and view bookings</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'rideManager') {
    return <RideManagerDashboard onLogout={() => setView('landing')} />;
  }

  if (view === 'booking') {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Boat Ticket Management System</h1>
          <button className="back-button" onClick={() => setView('landing')}>
            Back to Home
          </button>
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

            {currentStep === 3 && selectedDate && selectedTimeSlot && (
              <div className="step-content">
                <h2>Select Rides</h2>
                <div className="rides-container">
                  <div className="rides-grid">
                    {[
                      {
                        id: '1',
                        name: 'VIP Experience',
                        description: 'Luxury cruise with premium amenities, gourmet refreshments, and personalized service',
                        price: 150,
                        availableSeats: 10,
                        departureTime: format(selectedTimeSlot, 'HH:mm'),
                        arrivalTime: format(new Date(selectedTimeSlot.getTime() + 120 * 60 * 1000), 'HH:mm')
                      },
                      {
                        id: '2',
                        name: 'Regular Experience',
                        description: 'Comfortable cruise with standard amenities and scenic views',
                        price: 75,
                        availableSeats: 30,
                        departureTime: format(selectedTimeSlot, 'HH:mm'),
                        arrivalTime: format(new Date(selectedTimeSlot.getTime() + 90 * 60 * 1000), 'HH:mm')
                      }
                    ].map((ride) => (
                      <RideCard
                        key={ride.id}
                        {...ride}
                        quantity={cartItems.find(item => item.id === ride.id)?.quantity || 0}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </div>
                  <div className="cart-summary">
                    <h3>Cart Summary</h3>
                    {cartItems.length > 0 ? (
                      <>
                        {cartItems.map(item => (
                          <div key={item.id} className="cart-item">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="cart-total">
                          <strong>Total:</strong>
                          <strong>₹{cartItems.reduce((total, item) => total + item.price * item.quantity, 0)}</strong>
                        </div>
                      </>
                    ) : (
                      <p>Your cart is empty</p>
                    )}
                    <button
                      className="checkout-button"
                      onClick={handleCheckout}
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="step-content">
                <h2>Payment</h2>
                <Payment
                  totalAmount={cartItems.reduce((total, item) => total + item.price * item.quantity, 0)}
                  onPaymentComplete={handlePaymentComplete}
                  onCancel={() => setCurrentStep(3)}
                />
              </div>
            )}

            {currentStep === 5 && ticketId && (
              <div className="step-content">
                <h2>Your Ticket</h2>
                <Ticket ticketId={ticketId} />
                <button
                  className="next-button"
                  onClick={() => setView('landing')}
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (view === 'bookings') {
    return (
      <div className="App">
        <header className="App-header">
          <h1>My Bookings</h1>
          <button className="back-button" onClick={() => setView('landing')}>
            Back to Home
          </button>
        </header>
        <main className="main-content">
          <BookingsList />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Boat Ticket Management System</h1>
        <button className="back-button" onClick={() => setView('landing')}>
          Back to Home
        </button>
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

          {currentStep === 3 && selectedDate && selectedTimeSlot && (
            <div className="step-content">
              <h2>Select Rides</h2>
              <div className="rides-container">
                <div className="rides-grid">
                  {[
                    {
                      id: '1',
                      name: 'VIP Experience',
                      description: 'Luxury cruise with premium amenities, gourmet refreshments, and personalized service',
                      price: 150,
                      availableSeats: 10,
                      departureTime: format(selectedTimeSlot, 'HH:mm'),
                      arrivalTime: format(new Date(selectedTimeSlot.getTime() + 120 * 60 * 1000), 'HH:mm')
                    },
                    {
                      id: '2',
                      name: 'Regular Experience',
                      description: 'Comfortable cruise with standard amenities and scenic views',
                      price: 75,
                      availableSeats: 30,
                      departureTime: format(selectedTimeSlot, 'HH:mm'),
                      arrivalTime: format(new Date(selectedTimeSlot.getTime() + 90 * 60 * 1000), 'HH:mm')
                    }
                  ].map((ride) => (
                    <RideCard
                      key={ride.id}
                      {...ride}
                      quantity={cartItems.find(item => item.id === ride.id)?.quantity || 0}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
                <div className="cart-summary">
                  <h3>Cart Summary</h3>
                  {cartItems.length > 0 ? (
                    <>
                      {cartItems.map(item => (
                        <div key={item.id} className="cart-item">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="cart-total">
                        <strong>Total:</strong>
                        <strong>₹{cartItems.reduce((total, item) => total + item.price * item.quantity, 0)}</strong>
                      </div>
                    </>
                  ) : (
                    <p>Your cart is empty</p>
                  )}
                  <button
                    className="checkout-button"
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
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