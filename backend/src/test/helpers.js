const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'customer',
    isActive: true
  };

  const user = await User.create({ ...defaultUser, ...userData });
  return user;
};

const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createTestBoat = async (boatData = {}) => {
  const defaultBoat = {
    name: 'Test Boat',
    capacity: 50,
    type: 'ferry',
    status: 'available'
  };

  const boat = await Boat.create({ ...defaultBoat, ...boatData });
  return boat;
};

const createTestPier = async (pierData = {}) => {
  const defaultPier = {
    name: 'Test Pier',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    operatingHours: {
      start: '09:00',
      end: '17:00'
    }
  };

  const pier = await Pier.create({ ...defaultPier, ...pierData });
  return pier;
};

const createTestTimeslot = async (timeslotData = {}) => {
  const defaultTimeslot = {
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
    price: 100,
    maxCapacity: 50,
    bookedCapacity: 0
  };

  const timeslot = await Timeslot.create({ ...defaultTimeslot, ...timeslotData });
  return timeslot;
};

const createTestBooking = async (bookingData = {}) => {
  const defaultBooking = {
    numberOfTickets: 2,
    totalAmount: 200,
    status: 'pending',
    paymentStatus: 'pending'
  };

  const booking = await Booking.create({ ...defaultBooking, ...bookingData });
  return booking;
};

const createTestTicket = async (ticketData = {}) => {
  const defaultTicket = {
    passengerName: 'Test Passenger',
    passengerAge: 25,
    passengerGender: 'male',
    status: 'valid'
  };

  const ticket = await Ticket.create({ ...defaultTicket, ...ticketData });
  return ticket;
};

module.exports = {
  createTestUser,
  generateTestToken,
  createTestBoat,
  createTestPier,
  createTestTimeslot,
  createTestBooking,
  createTestTicket
}; 