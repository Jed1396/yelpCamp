//Review for specific campground route
const express = require('express')
const router = express.Router({ mergeParams: true })
const Campground = require('../models/campground')
const Review = require('../models/review')
const wrapAsync = require('../utils/wrapAsync')

//middleware for checking if you are loggedIn (Authentication)
const requireLogin = (req, res, next) => {
    console.log(req.user)
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'Required to log in first')
        return res.redirect('/login')
    }

    else {
        next()
    }
}


router.post('/', requireLogin, wrapAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const { rating, comment } = req.body
    const review = new Review({
        rating: rating, comment: comment
    })
    review.author = req.user._id
    campground.reviews.push(review)
    review.campgrounds = campground
    await campground.save()
    await review.save()
    req.flash('success', 'Sucessfully created a review')
    res.redirect(`/campgrounds/${campground._id}`)

}))

//deleting targeted/specific review in a campground
router.delete('/:reviewId', requireLogin, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params
    await Campground.findByIdAndUpdate({ _id: id }, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId)
    req.flash('success', 'Successfully deleted review')
    res.redirect(`/campgrounds/${id}`)
}))

module.exports = router