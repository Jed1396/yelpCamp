const { string, number } = require('joi')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Review = require('./review')
const User = require('./user')
const opts = { toJSON: { virtuals: true } };
const campgroundSchema = new Schema({
    title: { type: String, require: true },
    geometry: {
        type: {
            type: "String",
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    images: [{
        url: String,
        filename: String

    }],
    price: { type: Number, require: true },
    description: { type: String, require: [true, 'cannot be blank'] },
    location: { type: String, require: true },
    reviews:
        [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    author:
        { type: Schema.Types.ObjectId, ref: 'User' }

}, opts)

campgroundSchema.virtual('properties.popUp').get(function () {
    return `${this._id}`
})
//Middleware that will delete the reviews connected to the campground || Either you put in the app.js file or in a schema file
campgroundSchema.post('findOneAndDelete', async (data) => {
    const cIds = await data.reviews.map(c => c._id)
    console.log(cIds)
    await Review.deleteMany({ _id: { $in: cIds } })
})


const Campground = mongoose.model('Campground', campgroundSchema)

module.exports = Campground
