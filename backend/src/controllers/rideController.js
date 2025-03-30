const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// Get all rides
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find();
    res.status(200).json({
      status: 'success',
      data: rides
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Check availability for a specific ride, date and time slot
exports.checkAvailability = async (req, res) => {
  try {
    const { rideId, date, timeSlot } = req.body;

    // Get the ride details
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    // Get all bookings for this ride, date and time slot
    const bookings = await Booking.find({
      rideId,
      date: new Date(date),
      timeSlot,
      status: 'confirmed'
    });

    // Calculate total booked seats
    const totalBooked = bookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    // Calculate available seats
    const availableSeats = ride.maxCapacity - totalBooked;

    res.status(200).json({
      status: 'success',
      data: {
        availableSeats,
        totalCapacity: ride.maxCapacity,
        totalBooked
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Initialize rides (for development)
exports.initializeRides = async (req, res) => {
  try {
    // Clear existing rides
    await Ride.deleteMany({});

    // Create regular and VIP rides
    const rides = await Ride.create([
      {
        name: 'Regular Ride',
        description: 'Standard boat ride with comfortable seating',
        price: 50,
        duration: '2 hours',
        maxCapacity: 100
      },
      {
        name: 'VIP Ride',
        description: 'Premium boat ride with luxury amenities',
        price: 100,
        duration: '2 hours',
        maxCapacity: 100
      }
    ]);

    res.status(201).json({
      status: 'success',
      data: rides
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 