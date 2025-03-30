const { AppError } = require('../middleware/errorHandler');
const Boat = require('../models/boat.model');
const { logger } = require('../utils/logger');

exports.createBoat = async (req, res, next) => {
  try {
    const boat = await Boat.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { boat }
    });
  } catch (error) {
    logger.error('Boat creation error:', error);
    next(error);
  }
};

exports.getAllBoats = async (req, res, next) => {
  try {
    const boats = await Boat.find()
      .populate('pier', 'name location')
      .sort('name');

    res.status(200).json({
      status: 'success',
      results: boats.length,
      data: { boats }
    });
  } catch (error) {
    logger.error('Get all boats error:', error);
    next(error);
  }
};

exports.getBoat = async (req, res, next) => {
  try {
    const boat = await Boat.findById(req.params.id)
      .populate('pier', 'name location')
      .populate('rides')
      .populate('timeslots');

    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { boat }
    });
  } catch (error) {
    logger.error('Get boat error:', error);
    next(error);
  }
};

exports.updateBoat = async (req, res, next) => {
  try {
    const boat = await Boat.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { boat }
    });
  } catch (error) {
    logger.error('Update boat error:', error);
    next(error);
  }
};

exports.deleteBoat = async (req, res, next) => {
  try {
    const boat = await Boat.findById(req.params.id);

    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }

    // Check if boat has any active rides or timeslots
    if (boat.rides.length > 0 || boat.timeslots.length > 0) {
      return next(new AppError('Cannot delete boat with active rides or timeslots', 400));
    }

    await boat.remove();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete boat error:', error);
    next(error);
  }
};

exports.updateBoatLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    const boat = await Boat.findById(req.params.id);

    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }

    boat.currentLocation.coordinates = coordinates;
    await boat.save();

    res.status(200).json({
      status: 'success',
      data: { boat }
    });
  } catch (error) {
    logger.error('Update boat location error:', error);
    next(error);
  }
};

exports.updateBoatStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const boat = await Boat.findById(req.params.id);

    if (!boat) {
      return next(new AppError('Boat not found', 404));
    }

    boat.status = status;
    await boat.save();

    res.status(200).json({
      status: 'success',
      data: { boat }
    });
  } catch (error) {
    logger.error('Update boat status error:', error);
    next(error);
  }
};

exports.getBoatsByPier = async (req, res, next) => {
  try {
    const boats = await Boat.find({ pier: req.params.pierId })
      .populate('pier', 'name location')
      .sort('name');

    res.status(200).json({
      status: 'success',
      results: boats.length,
      data: { boats }
    });
  } catch (error) {
    logger.error('Get boats by pier error:', error);
    next(error);
  }
}; 