const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Ride = require('../models/ride.model');
const User = require('../models/user.model');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/boat-ticket-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Sample rides data
const rides = [
  {
    name: 'VIP Cruise',
    description: 'Experience luxury with our VIP cruise package featuring premium amenities and exclusive services',
    duration: 120,
    price: 150,
    capacity: 10,
    schedule: {
      startTime: '09:00',
      endTime: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    status: 'active'
  },
  {
    name: 'Regular Cruise',
    description: 'Enjoy a comfortable regular cruise experience with standard amenities and services',
    duration: 90,
    price: 75,
    capacity: 30,
    schedule: {
      startTime: '09:00',
      endTime: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    status: 'active'
  }
];

// Sample users data
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'customer',
    password: 'password123'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    role: 'customer',
    password: 'password123'
  }
];

// Generate random date within next 7 days
const getRandomDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 7));
  return date;
};

// Generate random time between 9 AM and 5 PM
const getRandomTime = () => {
  const hours = Math.floor(Math.random() * 9) + 9; // 9 AM to 5 PM
  return `${hours.toString().padStart(2, '0')}:00`;
};

// Generate test data
const generateTestData = async () => {
  try {
    // Clear existing data
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await User.deleteMany({});

    // Create rides
    const createdRides = await Ride.insertMany(rides);
    console.log('Created rides:', createdRides.length);

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Generate bookings
    const bookings = [];
    for (let i = 0; i < 20; i++) {
      const ride = createdRides[Math.floor(Math.random() * createdRides.length)];
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const date = getRandomDate();
      const time = getRandomTime();
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalAmount = ride.price * quantity;
      const status = Math.random() > 0.2 ? 'confirmed' : 'cancelled';
      const ticketId = `TKT${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      bookings.push({
        ride: ride._id,
        customer: user._id,
        date,
        time,
        quantity,
        totalAmount,
        status,
        ticketId,
        qrCode: `QR${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paymentStatus: status === 'confirmed' ? 'completed' : 'refunded',
        paymentId: `PAY${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        bookingStatus: status
      });
    }

    const createdBookings = await Booking.insertMany(bookings);
    console.log('Created bookings:', createdBookings.length);

    console.log('Test data generation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
};

generateTestData(); 