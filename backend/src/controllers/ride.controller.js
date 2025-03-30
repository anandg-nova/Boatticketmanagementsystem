const Ride = require('../models/ride.model');
const Booking = require('../models/booking.model');
const { validateRide } = require('../utils/validation');

// Get all rides
exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'active' });
    res.status(200).json({
      success: true,
      data: rides
    });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rides',
      details: error.message
    });
  }
};

// Get ride by ID
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }
    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ride',
      details: error.message
    });
  }
};

// Create new ride
exports.createRide = async (req, res) => {
  try {
    const { error } = validateRide(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const ride = await Ride.create({
      ...req.body,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ride',
      details: error.message
    });
  }
};

// Update ride
exports.updateRide = async (req, res) => {
  try {
    const { error } = validateRide(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ride',
      details: error.message
    });
  }
};

// Delete ride
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ride',
      details: error.message
    });
  }
};

// Get bookings for a specific ride
exports.getRideBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ rideId: req.params.id })
      .sort({ date: -1 })
      .populate('rideId', 'name duration price');

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching ride bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ride bookings',
      details: error.message
    });
  }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ride status',
      details: error.message
    });
  }
}; 