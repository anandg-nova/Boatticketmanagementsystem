import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

interface Ticket {
  _id: string;
  qrCode: string;
  ride: {
    name: string;
    description: string;
  };
}

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { booking } = location.state || {};

  if (!booking) {
    navigate('/');
    return null;
  }

  // Fetch tickets for the booking
  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', booking._id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/bookings/${booking._id}`);
      return response.data.data.booking;
    },
  });

  useEffect(() => {
    if (bookingData?.tickets) {
      setTickets(bookingData.tickets);
    }
  }, [bookingData]);

  const handleDownloadTickets = () => {
    // Create a PDF with all tickets
    // This would be implemented with a PDF generation library
    console.log('Downloading tickets...');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Paper className="p-6">
        <Typography variant="h4" component="h1" className="mb-8 text-center">
          Booking Confirmation
        </Typography>

        {isLoading ? (
          <Typography>Loading booking details...</Typography>
        ) : (
          <>
            <Box className="mb-8">
              <Typography variant="h6" className="mb-4">
                Booking Details
              </Typography>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Typography>Booking ID</Typography>
                  <Typography>{booking._id}</Typography>
                </div>
                <div className="flex justify-between">
                  <Typography>Date</Typography>
                  <Typography>
                    {new Date(booking.timeslot.startTime).toLocaleDateString()}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography>Time</Typography>
                  <Typography>
                    {new Date(booking.timeslot.startTime).toLocaleTimeString()} -{' '}
                    {new Date(booking.timeslot.endTime).toLocaleTimeString()}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography>Total Amount</Typography>
                  <Typography>${booking.totalAmount}</Typography>
                </div>
              </div>
            </Box>

            <Divider className="my-8" />

            <Box className="mb-8">
              <Typography variant="h6" className="mb-4">
                Your Tickets
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map((ticket) => (
                  <Paper key={ticket._id} className="p-4">
                    <Box className="flex flex-col items-center">
                      <QRCodeSVG
                        value={ticket.qrCode}
                        size={200}
                        level="H"
                        includeMargin
                        className="mb-4"
                      />
                      <Typography variant="h6" className="mb-2">
                        {ticket.ride.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="text-center">
                        {ticket.ride.description}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </div>
            </Box>

            <Box className="flex justify-center">
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownloadTickets}
              >
                Download All Tickets
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </div>
  );
};

export default BookingConfirmationPage; 