import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import './QRCodeValidator.css';

interface QRCodeValidatorProps {
  rideId: string;
  onValidationSuccess: (bookingId: string) => void;
}

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  duration: number;
}

const QRCodeValidator: React.FC<QRCodeValidatorProps> = ({ rideId, onValidationSuccess }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    duration: 0
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000);
        setTimer(prev => ({ ...prev, duration }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  const handleScan = async (result: string | null) => {
    if (result) {
      setScanResult(result);
      try {
        // Validate the QR code with the backend
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/validate`, {
          qrCode: result,
          rideId
        });

        if (response.data.success) {
          onValidationSuccess(response.data.bookingId);
          setError(null);
        } else {
          setError(response.data.message || 'Invalid ticket');
        }
      } catch (err) {
        setError('Failed to validate ticket');
        console.error('Validation error:', err);
      }
    }
  };

  const handleError = (error: Error) => {
    console.error('QR Scanner error:', error);
    setError('Failed to scan QR code');
  };

  const startTimer = () => {
    setTimer({
      isRunning: true,
      startTime: new Date(),
      duration: 0
    });
  };

  const stopTimer = async () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
    // Save the duration to the booking
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/update-duration`, {
        bookingId: scanResult,
        duration: timer.duration
      });
    } catch (err) {
      console.error('Failed to save duration:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="qr-validator">
      <h2>Scan Ticket QR Code</h2>
      
      <div className="qr-scanner">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={(result, error) => {
            if (result) {
              handleScan(result.getText());
            }
            if (error) {
              handleError(error);
            }
          }}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {scanResult && (
        <div className="validation-result">
          <p>Ticket validated successfully!</p>
          <div className="timer-controls">
            {!timer.isRunning ? (
              <button onClick={startTimer} className="start-button">
                Start Ride Timer
              </button>
            ) : (
              <button onClick={stopTimer} className="stop-button">
                Stop Ride Timer
              </button>
            )}
            <div className="timer-display">
              {formatDuration(timer.duration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeValidator; 