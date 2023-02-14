const express = require('express');
const router = express.Router({ mergeParams: true });
const User = require('../models/user');
const { userSchema } = require('../schemas');
const { validate } = require('joi');
const appError = require('../utils/appError');
const wrapAsync = require('../utils/wrapAsync');

const passport = require('passport');
const Campground = require('../models/campground');





//middleware for checking if you are loggedIn (Authentication)
const requireLogin = (req, res, next) => {
    // console.log(req.user)
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'Required to log in first')
        return res.redirect('/login')
    }

    else {
        next()
    }
}
const isAuthor = async (req, res, next) => {
    const camp = await Campground.findById(req.params.id)
    if (!camp.author.equals(req.user.id)) {
        req.flash('error', 'You are not authorized to access this page')
        res.redirect(`/campgrounds/${camp._id}`)
    }
    next()
}

//Middleware in registering new user
const validateUser = (req, res, next) => {
    const result = userSchema.validate(req.body)
    if (result.error) {
        req.flash('error', `${result.error.message}`)
        return res.redirect('/register')
        // throw new appError(`${result.error.message}`, 401)
    }
    else {
        next()
    }
}

// //hasing a password
// const hashPassword = async (pw) => {
//     const salt = await bcrypt.genSalt(12);
//     const hash = await bcrypt.hash(pw, salt)
//     return hash
// }





//Register Route
router.get('/register', (req, res) => {
    res.render('campgrounds/register')
})




router.post('/register', validateUser, wrapAsync(async (req, res, next) => {
    const { username, password, email } = req.body
    try {
        const userFind = await User.exists({ username: `${req.body.username}` })
        if (userFind) {
            req.flash('error', 'User already exists')
            res.redirect('/register')
        }
        else {
            const newUser = new User({
                username: username, email: email
            })
            const registeredUser = await User.register(newUser, password)
            req.login(registeredUser, (err) => {
                if (err) { return next(err) }
                req.flash('success', `Welcome to Yelp-Camp ${newUser.username}`)
                res.redirect('/campgrounds')
            })
        }
    } catch (e) {
        if (e.message === `E11000 duplicate key error collection: yelp-camp.users index: email_1 dup key: { email: "${email}" }`) {
            req.flash('error', e.message = 'Oops, the email already registered!')
            res.redirect('register');
        } else {
            req.flash('error', e.message);
            res.redirect('register')
        }
    }

}))

//Login Route
router.get('/login', (req, res) => {
    res.render('campgrounds/login')
})
router.post('/login', passport.authenticate('local', { failureFlash: 'Incorrect password or username', failureRedirect: '/login', keepSessionInfo: true, }), async (req, res, next) => {
    const { username, password } = req.body
    const userFind = await User.findOne({ username: username })
    if (userFind) {
        req.flash('success', `Welcome ${userFind.username}`)
        const redirectUrl = req.session.returnTo || '/campgrounds'
        delete req.session.returnTo
        res.redirect(redirectUrl)
    }

    //     if (!userFind) {
    //         req.flash('error', 'Incorrect credentials')
    //         return res.redirect('/login')  //stops/return and  will not execute the rest of the code block
    //     }
    //     // const validPw = await bcrypt.compare(password, userFind.password) 
    //     // console.log(validPw)
    //     if (validPw) {
    //         req.session.sessionId = userFind.id
    //         req.flash('success', `Logged in as ${username}`)
    //         res.redirect('/campgrounds')
    //     }
    //     else {
    //         req.flash('error', 'Incorrect credentials')
    //         res.redirect('/login')
    //     }
})

//logout user Route
router.post('/logout', async (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
})

router.get('/campgroundsOwned', requireLogin, async (req, res) => {
    const campgrounds = await Campground.find({ author: req.user._id })
    const foundAuthor = campgrounds.map(f => {
        return f.author
    })
    console.log(campgrounds)
    res.render('campgrounds/campgroundsowned', { campgrounds })
})




module.exports = router