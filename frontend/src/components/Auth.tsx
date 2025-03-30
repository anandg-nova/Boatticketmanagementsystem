import React, { useState, useEffect } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (userData: { role: string; token: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-login for Ride Manager
  useEffect(() => {
    const autoLogin = async () => {
      try {
        setLoading(true);
        setError('');
        
        // First send OTP
        const sendOtpResponse = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: '9952966436' }),
        });

        const sendOtpData = await sendOtpResponse.json();
        
        if (sendOtpData.success) {
          // Then verify OTP
          const verifyOtpResponse = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              phoneNumber: '9952966436',
              otp: '123456'
            }),
          });

          const verifyOtpData = await verifyOtpResponse.json();
          
          if (verifyOtpData.success) {
            localStorage.setItem('token', verifyOtpData.token);
            onLogin({
              role: 'ride_manager',
              token: verifyOtpData.token
            });
          } else {
            setError(verifyOtpData.message || 'Invalid OTP');
          }
        } else {
          setError(sendOtpData.message || 'Failed to send OTP');
        }
      } catch (error) {
        setError('Failed to auto-login. Please try manually.');
      } finally {
        setLoading(false);
      }
    };

    // Trigger auto-login
    autoLogin();
  }, [onLogin]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsOtpSent(true);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        onLogin({
          role: data.user.role,
          token: data.token
        });
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {loading && <div className="loading-message">Logging in...</div>}
        <div className="auth-form">
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              disabled={isOtpSent || loading}
            />
          </div>

          {!isOtpSent ? (
            <button
              className="auth-button"
              onClick={handleSendOtp}
              disabled={!phoneNumber || loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="otp">OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  disabled={loading}
                />
              </div>
              <button
                className="auth-button"
                onClick={handleVerifyOtp}
                disabled={!otp || loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                className="resend-button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
                disabled={loading}
              >
                Change Phone Number
              </button>
            </>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Auth; 