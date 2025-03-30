const { AppError } = require('../middleware/errorHandler');
const Pier = require('../models/pier.model');
const { logger } = require('../utils/logger');

exports.createPier = async (req, res, next) => {
  try {
    const pier = await Pier.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { pier }
    });
  } catch (error) {
    logger.error('Pier creation error:', error);
    next(error);
  }
};

exports.getAllPiers = async (req, res, next) => {
  try {
    const piers = await Pier.find()
      .populate('boats', 'name capacity status')
      .sort('name');

    res.status(200).json({
      status: 'success',
      results: piers.length,
      data: { piers }
    });
  } catch (error) {
    logger.error('Get all piers error:', error);
    next(error);
  }
};

exports.getPier = async (req, res, next) => {
  try {
    const pier = await Pier.findById(req.params.id)
      .populate('boats', 'name capacity status')
      .populate('timeslots');

    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { pier }
    });
  } catch (error) {
    logger.error('Get pier error:', error);
    next(error);
  }
};

exports.updatePier = async (req, res, next) => {
  try {
    const pier = await Pier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { pier }
    });
  } catch (error) {
    logger.error('Update pier error:', error);
    next(error);
  }
};

exports.deletePier = async (req, res, next) => {
  try {
    const pier = await Pier.findById(req.params.id);

    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    // Check if pier has any boats or timeslots
    if (pier.boats.length > 0 || pier.timeslots.length > 0) {
      return next(new AppError('Cannot delete pier with active boats or timeslots', 400));
    }

    await pier.remove();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete pier error:', error);
    next(error);
  }
};

exports.updateOperatingHours = async (req, res, next) => {
  try {
    const { start, end } = req.body;
    const pier = await Pier.findById(req.params.id);

    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    pier.operatingHours = { start, end };
    await pier.save();

    res.status(200).json({
      status: 'success',
      data: { pier }
    });
  } catch (error) {
    logger.error('Update operating hours error:', error);
    next(error);
  }
};

exports.getPierCapacity = async (req, res, next) => {
  try {
    const pier = await Pier.findById(req.params.id)
      .populate('boats', 'capacity status');

    if (!pier) {
      return next(new AppError('Pier not found', 404));
    }

    const totalCapacity = pier.boats.reduce((sum, boat) => {
      return boat.status === 'available' ? sum + boat.capacity : sum;
    }, 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalCapacity,
        activeBoats: pier.boats.filter(boat => boat.status === 'available').length
      }
    });
  } catch (error) {
    logger.error('Get pier capacity error:', error);
    next(error);
  }
};

exports.getNearbyPiers = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    const piers = await Pier.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('boats', 'name capacity status');

    res.status(200).json({
      status: 'success',
      results: piers.length,
      data: { piers }
    });
  } catch (error) {
    logger.error('Get nearby piers error:', error);
    next(error);
  }
}; 