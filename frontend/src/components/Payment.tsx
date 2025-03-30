import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QRCode from 'qrcode.react';
import './Payment.css';

// Initialize Stripe with proper error handling
const stripePromise = (() => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  console.log('Loading Stripe with public key:', key ? key.substring(0, 10) + '...' : 'missing');
  if (!key) {
    console.error('Stripe public key is missing');
    return Promise.reject(new Error('Payment system configuration error'));
  }
  return loadStripe(key);
})();

interface PaymentProps {
  totalAmount: number;
  onPaymentComplete: (ticketId: string) => void;
  onCancel: () => void;
}

interface TicketDetails {
  ticketId: string;
  name: string;
  phone: string;
  amount: number;
  date: string;
}

const PaymentForm: React.FC<{ 
  totalAmount: number; 
  onPaymentComplete: (ticketId: string) => void;
  clientSecret: string;
  formData: { name: string; email: string; phone: string; };
}> = ({
  totalAmount,
  onPaymentComplete,
  clientSecret,
  formData
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      console.log('Stripe or Elements not ready:', { stripe: !!stripe, elements: !!elements });
      setError('Payment system is initializing...');
    } else {
      console.log('Stripe and Elements ready');
      setError(null);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not ready');
      setError('Payment system is not ready. Please try again.');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all contact information');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log('Confirming payment...');
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        console.error('Payment error:', submitError);
        throw new Error(submitError.message || 'Payment failed');
      }

      if (paymentIntent) {
        console.log('Payment successful:', paymentIntent.id);
        // Call the backend to create ticket and confirm payment
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payment/confirm-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              paymentIntentId: paymentIntent.id,
              customerDetails: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
              },
              ticketDetails: {
                rideName: 'Boat Ride', // This should come from the cart/booking context
                date: new Date().toISOString(), // Use ISO format for better date handling
                time: new Date().toLocaleTimeString(),
                quantity: 1, // This should come from the cart/booking context
                price: totalAmount,
                status: 'confirmed'
              }
            }),
          });

          const data = await response.json();
          console.log('Ticket creation response:', data);

          if (!response.ok || !data.success) {
            console.error('Ticket creation failed:', data);
            throw new Error(data.error || data.details || 'Failed to generate ticket');
          }

          if (!data.data?.ticket) {
            console.error('No ticket data in response:', data);
            throw new Error('No ticket data received from server');
          }

          onPaymentComplete(paymentIntent.id);
        } catch (error) {
          console.error('Ticket generation error:', error);
          throw new Error('Payment successful but failed to generate ticket. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement 
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
          },
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'auto',
              phone: 'auto',
            }
          }
        }} 
      />
      {error && (
        <div className="error-message" style={{ 
          color: '#df1b41',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fff0f3',
          borderRadius: '4px',
          border: '1px solid #df1b41'
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="submit-button"
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '12px',
          backgroundColor: processing ? '#cccccc' : '#0570de',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: processing ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
};

const Payment: React.FC<PaymentProps> = ({ totalAmount, onPaymentComplete, onCancel }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Add environment variable validation
  useEffect(() => {
    console.log('Environment variables:', {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      stripeKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'Present' : 'Missing'
    });
  }, []);

  // Initialize payment intent
  useEffect(() => {
    const initializePayment = async () => {
      try {
        console.log('Creating payment intent for amount:', totalAmount);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payment/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ amount: totalAmount, currency: 'usd' }),
        });

        console.log('Payment intent response status:', response.status);
        const data = await response.json();
        console.log('Payment intent response:', data);

        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to create payment intent');
        }

        if (!data.success || !data.data?.clientSecret) {
          throw new Error('Invalid payment intent response');
        }

        setClientSecret(data.data.clientSecret);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        setIsLoading(false);
      }
    };

    if (totalAmount > 0) {
      initializePayment();
    }
  }, [totalAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentComplete = (paymentIntentId: string) => {
    if (!paymentIntentId) return;
    
    const details: TicketDetails = {
      ticketId: paymentIntentId,
      name: formData.name || '',
      phone: formData.phone || '',
      amount: totalAmount,
      date: new Date().toLocaleDateString()
    };

    setTicketDetails(details);
    setIsPaymentComplete(true);
    onPaymentComplete(paymentIntentId);
  };

  if (isPaymentComplete && ticketDetails) {
    const qrData = JSON.stringify({
      id: ticketDetails.ticketId,
      name: ticketDetails.name,
      date: ticketDetails.date,
      amount: ticketDetails.amount,
      status: 'confirmed'
    });
    
    return (
      <div className="payment-container" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="success-message" style={{
          textAlign: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f0fff4',
          borderRadius: '8px',
          border: '1px solid #9ae6b4'
        }}>
          <h2 style={{ color: '#2f855a', margin: '0' }}>Payment Successful!</h2>
          <p style={{ color: '#48bb78', margin: '10px 0 0' }}>Your ticket has been generated and sent to your email.</p>
        </div>
        
        <div className="ticket-details" style={{
          border: '2px dashed #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0', color: '#2d3748' }}>Boat Ride Ticket</h3>
            <span style={{
              backgroundColor: '#48bb78',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px'
            }}>Confirmed</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <p style={{ color: '#718096', margin: '0 0 4px' }}>Ticket ID</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{ticketDetails.ticketId}</p>
            </div>
            <div>
              <p style={{ color: '#718096', margin: '0 0 4px' }}>Passenger Name</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{ticketDetails.name}</p>
            </div>
            <div>
              <p style={{ color: '#718096', margin: '0 0 4px' }}>Date</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{ticketDetails.date}</p>
            </div>
            <div>
              <p style={{ color: '#718096', margin: '0 0 4px' }}>Amount Paid</p>
              <p style={{ margin: '0', fontWeight: '600' }}>${ticketDetails.amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
          
        <div className="qr-code-container" style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f7fafc',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px', color: '#2d3748' }}>Entry QR Code</h3>
          <div className="qr-code" style={{
            display: 'inline-block',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <QRCode
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p style={{ 
            color: '#718096',
            margin: '15px 0 0',
            fontSize: '14px'
          }}>
            Show this QR code at the entrance for validation
          </p>
        </div>

        <div style={{
          marginTop: '30px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Print Ticket
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f7fafc',
              color: '#4a5568',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (stripeError) {
    return (
      <div className="payment-container">
        <div className="error-message">
          <h3>Payment System Error</h3>
          <p>{stripeError}</p>
          <p>Please try again later or contact support.</p>
        </div>
        <button onClick={onCancel} className="cancel-button">
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="payment-container">
        <div className="loading">
          <h3>Initializing Payment</h3>
          <p>Please wait while we set up the payment system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" style={{ 
        color: '#df1b41',
        padding: '20px',
        backgroundColor: '#fff0f3',
        borderRadius: '4px',
        border: '1px solid #df1b41',
        margin: '20px 0'
      }}>
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div style={{ 
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        Initializing payment system...
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h2>Payment Details</h2>
      <div className="contact-info">
        <h3>Contact Information</h3>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="payment-section">
        <h3>Card Details</h3>
        {clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0570de',
                  colorBackground: '#ffffff',
                  colorText: '#30313d',
                  colorDanger: '#df1b41',
                  fontFamily: 'system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '4px',
                },
              },
            }}
          >
            <PaymentForm
              totalAmount={totalAmount}
              onPaymentComplete={handlePaymentComplete}
              clientSecret={clientSecret}
              formData={formData}
            />
          </Elements>
        )}
      </div>

      <div className="button-group">
        <button
          type="button"
          onClick={onCancel}
          className="cancel-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#f8f9fa',
            color: '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Payment; 