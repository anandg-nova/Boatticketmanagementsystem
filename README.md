# Boat Ticket Management System

A full-stack web application for managing boat ride tickets with integrated payment processing using Stripe.

## Features

- User-friendly interface for booking boat rides
- Secure payment processing with Stripe integration
- QR code-based ticket validation
- Email confirmation for successful bookings
- Responsive design for all devices
- Real-time payment status updates

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Payment Processing: Stripe
- QR Code Generation: qrcode.react

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Stripe account with API keys

## Environment Variables

Create `.env` files in both frontend and backend directories:

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/boat-tickets
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boat-ticket-management.git
cd boat-ticket-management
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start the services:
```bash
# From the root directory
./start.sh
```

## Usage

1. Access the application at http://localhost:3000
2. Select a boat ride and fill in your details
3. Complete the payment process
4. Receive your ticket with QR code
5. Show the QR code at the entrance for validation

## Development

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:3001
- MongoDB runs on mongodb://localhost:27017

## Scripts

- `start.sh`: Starts all services (MongoDB, Backend, Frontend)
- `stop.sh`: Stops all services and cleans up

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 