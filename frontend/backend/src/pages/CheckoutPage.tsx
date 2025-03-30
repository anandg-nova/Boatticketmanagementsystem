import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

const steps = ['Contact Details', 'Payment Information'];

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [activeStep, setActiveStep] = useState(0);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: '',
    email: '',
    phone: '',
  });

  const { timeslot, cart } = location.state || {};

  if (!timeslot || !cart) {
    navigate('/');
    return null;
  }

  const totalAmount = cart.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  const handleContactDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!contactDetails.phone) {
        toast.error('Phone number is required');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await axios.post('/api/v1/bookings', bookingData);
      return response.data;
    },
    onSuccess: (data) => {
      navigate('/confirmation', { state: { booking: data.data.booking } });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      });

      if (paymentError) {
        toast.error(paymentError.message || 'Payment failed');
        return;
      }

      const bookingData = {
        timeslot: timeslot._id,
        customer: {
          name: contactDetails.name,
          email: contactDetails.email,
          phone: contactDetails.phone,
        },
        rides: cart.map((item: any) => ({
          ride: item.rideId,
          quantity: item.quantity,
        })),
        totalAmount,
      };

      createBookingMutation.mutate(bookingData);
    } catch (error) {
      toast.error('An error occurred during payment');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="space-y-4">
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={contactDetails.name}
                onChange={handleContactDetailsChange}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={contactDetails.email}
                onChange={handleContactDetailsChange}
              />
              <TextField
                fullWidth
                required
                label="Phone Number"
                name="phone"
                value={contactDetails.phone}
                onChange={handleContactDetailsChange}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Next
              </Button>
            </div>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <PaymentElement />
              <div className="flex justify-between">
                <Button
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!stripe || createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            </div>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Paper className="p-6">
        <Typography variant="h4" component="h1" className="mb-8 text-center">
          Checkout
        </Typography>

        <Stepper activeStep={activeStep} className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className="mb-8">
          <Typography variant="h6" className="mb-4">
            Order Summary
          </Typography>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Typography>Date</Typography>
              <Typography>
                {new Date(timeslot.startTime).toLocaleDateString()}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography>Time</Typography>
              <Typography>
                {new Date(timeslot.startTime).toLocaleTimeString()} -{' '}
                {new Date(timeslot.endTime).toLocaleTimeString()}
              </Typography>
            </div>
            {cart.map((item: any) => (
              <div key={item.rideId} className="flex justify-between">
                <Typography>
                  {item.rideName} x {item.quantity}
                </Typography>
                <Typography>${item.price * item.quantity}</Typography>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">${totalAmount}</Typography>
              </div>
            </div>
          </div>
        </Box>

        {renderStepContent(activeStep)}
      </Paper>
    </div>
  );
};

export default CheckoutPage; 