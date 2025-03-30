import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import '../styles/RideManagerDashboard.css';

interface Booking {
  _id: string;
  rideName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'completed';
  quantity: number;
  totalAmount: number;
  ticketId: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  elapsedTime?: number;
}

interface RideManagerDashboardProps {
  onLogout: () => void;
}

const RideManagerDashboard: React.FC<RideManagerDashboardProps> = ({ onLogout }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'day' | 'month' | 'hour'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterHour, setFilterHour] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(prevBookings => 
        prevBookings.map(booking => {
          if (booking.isActive && booking.status === 'in_progress') {
            const newElapsedTime = (booking.elapsedTime || 0) + 1;
            if (newElapsedTime >= 120) { // 2 minutes = 120 seconds
              handleStopRide(booking._id, new Event('timeout') as any);
              return { ...booking, isActive: false, elapsedTime: 120, status: 'completed' };
            }
            return { ...booking, elapsedTime: newElapsedTime };
          }
          return booking;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/all-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const bookingsWithTimer = response.data.data.bookings.map((booking: Booking) => ({
        ...booking,
        isActive: false,
        elapsedTime: 0
      }));
      setBookings(bookingsWithTimer);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to view bookings.');
        onLogout();
      } else {
        setError('Failed to fetch bookings. Please try again later.');
      }
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async (bookingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to manage rides.');
        onLogout();
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/start-ride`,
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { 
                  ...booking, 
                  isActive: true, 
                  elapsedTime: 0,
                  status: 'in_progress',
                  startTime: new Date().toISOString()
                }
              : booking
          )
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to manage rides.');
        onLogout();
      } else {
        setError('Failed to start ride. Please try again.');
        console.error('Error starting ride:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopRide = async (bookingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to manage rides.');
        onLogout();
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/stop-ride`,
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { 
                  ...booking, 
                  isActive: false, 
                  elapsedTime: 0,
                  status: 'completed',
                  endTime: new Date().toISOString()
                }
              : booking
          )
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Please log in to manage rides.');
        onLogout();
      } else {
        setError('Failed to stop ride. Please try again.');
        console.error('Error stopping ride:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    
    switch (filterType) {
      case 'day':
        return bookingDate.toISOString().split('T')[0] === filterDate;
      case 'month':
        return bookingDate.toISOString().slice(0, 7) === filterMonth;
      case 'hour':
        return bookingDate.getHours().toString().padStart(2, '0') === filterHour;
      default:
        return true;
    }
  });

  return (
    <div className="ride-manager-dashboard">
      <header className="dashboard-header">
        <h1>Ride Manager Dashboard</h1>
        <div className="header-actions">
          <button className="scan-button" onClick={() => setScanMode(!scanMode)}>
            {scanMode ? 'Cancel Scan' : 'Scan Ticket'}
          </button>
          <button className="logout-button" onClick={onLogout}>
            Back to Home
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {scanMode ? (
        <div className="scan-section">
          <h2>Scan Ticket QR Code</h2>
          <div className="scan-area">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={(result: any, error: any) => {
                if (result) {
                  console.log('QR Code scanned:', result.getText());
                }
                if (error) {
                  console.error('QR Scanner error:', error);
                }
              }}
            />
            <div className="manual-input">
              <input
                type="text"
                placeholder="Enter ticket ID manually"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    console.log('Manual ticket ID:', (e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="bookings-list">
            <div className="filter-section">
              <h2>Filter Bookings</h2>
              <div className="filter-options">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'day' | 'month' | 'hour')}
                >
                  <option value="all">All Bookings</option>
                  <option value="day">By Day</option>
                  <option value="month">By Month</option>
                  <option value="hour">By Hour</option>
                </select>

                {filterType === 'day' && (
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                )}

                {filterType === 'month' && (
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  />
                )}

                {filterType === 'hour' && (
                  <select
                    value={filterHour}
                    onChange={(e) => setFilterHour(e.target.value)}
                  >
                    <option value="">Select Hour</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Ride Name</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.rideName}</td>
                      <td>
                        {new Date(booking.date).toLocaleDateString()} {booking.time}
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{booking.quantity}</td>
                      <td>₹{booking.totalAmount}</td>
                      <td>
                        {booking.status === 'confirmed' && (
                          <div className="ride-controls">
                            <button
                              className="ride-button start"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStartRide(booking._id, e);
                              }}
                              disabled={loading}
                            >
                              Start Ride
                            </button>
                          </div>
                        )}
                        {booking.status === 'in_progress' && (
                          <div className="ride-controls">
                            <span className="timer">
                              {formatTime(booking.elapsedTime || 0)}
                            </span>
                            <button
                              className="ride-button stop"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStopRide(booking._id, e);
                              }}
                              disabled={loading}
                            >
                              Stop Ride
                            </button>
                          </div>
                        )}
                        {booking.status === 'completed' && (
                          <span className="status-badge completed">Completed</span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="status-badge cancelled">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideManagerDashboard; 