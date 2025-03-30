const Joi = require('joi');

const rideSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10),
  duration: Joi.number().required().min(1),
  price: Joi.number().required().min(0),
  capacity: Joi.number().required().min(1),
  schedule: Joi.object({
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
  }).required(),
  status: Joi.string().valid('active', 'inactive', 'cancelled')
});

exports.validateRide = (data) => {
  return rideSchema.validate(data);
}; 