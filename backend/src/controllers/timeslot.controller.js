const { AppError } = require('../middleware/errorHandler');
const Timeslot = require('../models/timeslot.model');
const Boat = require('../models/boat.model');
const Pier = require('../models/pier.model');
const { logger } = require('../utils/logger');

exports.createTimeslot = async (req, res, next) => {
  try {
    const { boatId, pierId, startTime, endTime, price } = req.body;

    // Check if boat exists and is available
    const boat = await Boat.findById(boatId);
    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }
    if (boat.status !== 'available') {
      return next(new AppError('Boat is not available', 400));
    }

    // Check if pier exists
    const pier = await Pier.findById(pierId);
    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    // Check for overlapping timeslots
    const overlappingTimeslot = await Timeslot.findOne({
      boat: boatId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (overlappingTimeslot) {
      return next(new AppError('Timeslot overlaps with existing timeslot', 400));
    }

    const timeslot = await Timeslot.create({
      boat: boatId,
      pier: pierId,
      startTime,
      endTime,
      price
    });

    // Update boat and pier references
    boat.timeslots.push(timeslot._id);
    pier.timeslots.push(timeslot._id);
    await Promise.all([boat.save(), pier.save()]);

    res.status(201).json({
      status: 'success',
      data: { timeslot }
    });
  } catch (error) {
    logger.error('Timeslot creation error:', error);
    next(error);
  }
};

exports.getAllTimeslots = async (req, res, next) => {
  try {
    const timeslots = await Timeslot.find()
      .populate('boat', 'name capacity status')
      .populate('pier', 'name location')
      .sort('startTime');

    res.status(200).json({
      status: 'success',
      results: timeslots.length,
      data: { timeslots }
    });
  } catch (error) {
    logger.error('Get all timeslots error:', error);
    next(error);
  }
};

exports.getTimeslot = async (req, res, next) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id)
      .populate('boat', 'name capacity status')
      .populate('pier', 'name location')
      .populate('bookings');

    if (!timeslot) {
      return next(new AppError('Timeslot not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { timeslot }
    });
  } catch (error) {
    logger.error('Get timeslot error:', error);
    next(error);
  }
};

exports.updateTimeslot = async (req, res, next) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id);

    if (!timeslot) {
      return next(new AppError('Timeslot not found', 404));
    }

    // Check if timeslot has any bookings
    if (timeslot.bookings.length > 0) {
      return next(new AppError('Cannot update timeslot with existing bookings', 400));
    }

    // Check for overlapping timeslots if time is being updated
    if (req.body.startTime || req.body.endTime) {
      const overlappingTimeslot = await Timeslot.findOne({
        boat: timeslot.boat,
        _id: { $ne: timeslot._id },
        startTime: { $lt: req.body.endTime || timeslot.endTime },
        endTime: { $gt: req.body.startTime || timeslot.startTime }
      });

      if (overlappingTimeslot) {
        return next(new AppError('Timeslot overlaps with existing timeslot', 400));
      }
    }

    const updatedTimeslot = await Timeslot.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: { timeslot: updatedTimeslot }
    });
  } catch (error) {
    logger.error('Update timeslot error:', error);
    next(error);
  }
};

exports.deleteTimeslot = async (req, res, next) => {
  try {
    const timeslot = await Timeslot.findById(req.params.id);

    if (!timeslot) {
      return next(new AppError('Timeslot not found', 404));
    }

    // Check if timeslot has any bookings
    if (timeslot.bookings.length > 0) {
      return next(new AppError('Cannot delete timeslot with existing bookings', 400));
    }

    // Remove timeslot from boat and pier references
    await Promise.all([
      Boat.findByIdAndUpdate(timeslot.boat, {
        $pull: { timeslots: timeslot._id }
      }),
      Pier.findByIdAndUpdate(timeslot.pier, {
        $pull: { timeslots: timeslot._id }
      })
    ]);

    await timeslot.remove();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete timeslot error:', error);
    next(error);
  }
};

exports.getTimeslotsByBoat = async (req, res, next) => {
  try {
    const timeslots = await Timeslot.find({ boat: req.params.boatId })
      .populate('pier', 'name location')
      .sort('startTime');

    res.status(200).json({
      status: 'success',
      results: timeslots.length,
      data: { timeslots }
    });
  } catch (error) {
    logger.error('Get timeslots by boat error:', error);
    next(error);
  }
};

exports.getTimeslotsByPier = async (req, res, next) => {
  try {
    const timeslots = await Timeslot.find({ pier: req.params.pierId })
      .populate('boat', 'name capacity status')
      .sort('startTime');

    res.status(200).json({
      status: 'success',
      results: timeslots.length,
      data: { timeslots }
    });
  } catch (error) {
    logger.error('Get timeslots by pier error:', error);
    next(error);
  }
};

exports.getAvailableTimeslots = async (req, res, next) => {
  try {
    const { date, pierId } = req.query;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      startTime: { $gte: startOfDay, $lte: endOfDay },
      'bookings.0': { $exists: false } // Only get timeslots with no bookings
    };

    if (pierId) {
      query.pier = pierId;
    }

    const timeslots = await Timeslot.find(query)
      .populate('boat', 'name capacity status')
      .populate('pier', 'name location')
      .sort('startTime');

    res.status(200).json({
      status: 'success',
      results: timeslots.length,
      data: { timeslots }
    });
  } catch (error) {
    logger.error('Get available timeslots error:', error);
    next(error);
  }
}; 