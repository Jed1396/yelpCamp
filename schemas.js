const Joi = require('joi')

module.exports.campgroundSchema = Joi.object({
    title: Joi.string().required(),
    price: Joi.number().required().min(0),
    images: Joi.string(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    deleteImages: Joi.array()
}).required()


module.exports.userSchema = Joi.object({
    username: Joi.string().required().min(5),
    password: Joi.string().required().min(5),
    email: Joi.string().required()
})


module.exports.reviewSchema = Joi.object({
    rating: Joi.number().required,
    body: Joi.string().required()
}).required()