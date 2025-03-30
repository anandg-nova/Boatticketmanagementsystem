import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import './Ticket.css';

interface TicketProps {
  ticketId: string;
}

interface TicketData {
  id: string;
  rideName: string;
  date: string;
  time: string;
  quantity: number;
  price: number;
  status: string;
}

const Ticket: React.FC<TicketProps> = ({ ticketId }) => {
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const response = await axios.get(`/api/payment/ticket/${ticketId}/qr`);
        setQrCode(response.data.qrCode);
        setTicketData(response.data.ticketData);
      } catch (error) {
        setError('Failed to load ticket data');
        console.error('Ticket data fetch error:', error);
      }
    };

    fetchTicketData();
  }, [ticketId]);

  if (error) {
    return <div className="ticket-error">{error}</div>;
  }

  if (!ticketData || !qrCode) {
    return <div className="ticket-loading">Loading ticket...</div>;
  }

  return (
    <div className="ticket-container">
      <div className="ticket-header">
        <h2>Your Ticket</h2>
        <div className="ticket-status">
          Status: <span className={`status-${ticketData.status}`}>{ticketData.status}</span>
        </div>
      </div>

      <div className="ticket-details">
        <div className="detail-row">
          <span className="label">Ride:</span>
          <span className="value">{ticketData.rideName}</span>
        </div>
        <div className="detail-row">
          <span className="label">Date:</span>
          <span className="value">{new Date(ticketData.date).toLocaleDateString()}</span>
        </div>
        <div className="detail-row">
          <span className="label">Time:</span>
          <span className="value">{ticketData.time}</span>
        </div>
        <div className="detail-row">
          <span className="label">Quantity:</span>
          <span className="value">{ticketData.quantity}</span>
        </div>
        <div className="detail-row">
          <span className="label">Price:</span>
          <span className="value">${ticketData.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="qr-code-container">
        <QRCodeSVG value={qrCode} size={200} />
        <p className="qr-instructions">Show this QR code at the entrance</p>
      </div>

      <div className="ticket-footer">
        <p>Ticket ID: {ticketData.id}</p>
        <button className="download-btn" onClick={() => window.print()}>
          Download Ticket
        </button>
      </div>
    </div>
  );
};

export default Ticket; 