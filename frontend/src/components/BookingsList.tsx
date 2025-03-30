import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Booking } from '../types/booking';

const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchBookings();
    }
  }, []);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/send-otp`,
        { phoneNumber }
      );
      
      if (response.data.success) {
        setIsOtpSent(true);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-otp`,
        { phoneNumber, otp }
      );
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setIsAuthenticated(true);
        fetchBookings();
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setBookings(response.data.data.bookings);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setError('Please log in to view your bookings.');
      } else {
        setError('Failed to fetch bookings. Please try again later.');
      }
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setBookings([]);
  };

  const filteredBookings = bookings
    .filter(booking => filter === 'all' || booking.status === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'amount') {
        return sortOrder === 'asc'
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      }
      // Sort by status
      return sortOrder === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    });

  const handleSort = (field: 'date' | 'status' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-section">
        <div className="auth-card">
          <h2>Login to View Bookings</h2>
          {loading && <div className="loading">Processing...</div>}
          {error && <div className="error">{error}</div>}
          
          {!isOtpSent ? (
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                disabled={loading}
              />
              <button
                className="auth-button"
                onClick={handleSendOtp}
                disabled={!phoneNumber || loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                disabled={loading}
              />
              <button
                className="auth-button"
                onClick={handleVerifyOtp}
                disabled={!otp || loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
                disabled={loading}
              >
                Change Phone Number
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="bookings-list">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <div className="header-actions">
          <div className="filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          No bookings found.
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Ride Name</th>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date & Time {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Quantity</th>
                <th onClick={() => handleSort('amount')} className="sortable">
                  Total Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
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
                    <button
                      className="view-details-btn"
                      onClick={() => {/* TODO: Implement view details */}}
                    >
                      View Details
                    </button>
                    {booking.status === 'pending' && (
                      <button
                        className="cancel-btn"
                        onClick={() => {/* TODO: Implement cancellation */}}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsList; 