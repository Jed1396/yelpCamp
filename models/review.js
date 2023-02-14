const mongoose = require('mongoose')
const Schema = mongoose.Schema



const reviewSchema = new Schema({
    comment: {
        type: String,
        require: true
    },
    rating: Number,
    campgrounds: {
        type: Schema.Types.ObjectId,
        ref: 'Campground'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review