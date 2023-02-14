//important things for building a web app
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}




const express = require('express')
const app = express()
const path = require('path')
//Since express can only use GET and POST, this will override the method to use(PUT,PATCH,DELETE)
var methodOverride = require('method-override')
var engine = require('ejs-mate')
//Mongoose is a way to communicate JS and MongoDB
const mongoose = require('mongoose')
//Schemas for different models
const Campground = require('./models/campground')
const User = require('./models/user')
const Review = require('./models/review')
const About = require('./models/about')
//schema for validating data using JOI package
const { campgroundSchema } = require('./schemas')
const flash = require('connect-flash')
var bodyParser = require('body-parser')
//utilities for errors etc...
const wrapAsync = require('./utils/wrapAsync')
const AppError = require('./utils/appError')
const passport = require('passport')
const localStrategy = require('passport-local')
//SECURITY -> sanitizes inputs against query selector injection attacks: ('$' || '.' in the req.query, req.body, req.params)
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");
//part of the security



const session = require('express-session')
const MongoStore = require('connect-mongo')




//this is the mapboxSDK found in github
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mbxGeocoder = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN })




//to see more info chech github/ multer-cloudinary-storage
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer')

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'YelpCamp',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

const upload = multer({ storage: storage })

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

// //mapbox sdk check via npm ****** !!!! NOT YET DONE***!!!!to be continued check mapbox docs
// const mbxStyles = require('@mapbox/mapbox-sdk/services/styles');
// const stylesService = mbxStyles({ accessToken: MAPBOX_TOKEN });


//DATABASE connection
// 'mongodb://127.0.0.1:27017/yelp-camp'
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
mongoose.connect(dbUrl)
    .then(() => {
        console.log(`connection Open: ${dbUrl}`)
    })
    .catch((e) => {
        console.log("oh no error")
        console.log(e)
    })





app.engine('ejs', engine)
app.set('view engine', 'ejs')
//this will set up the directory to look for the 'views' folder and you can insert all EJS file in that directory.
app.set('views', path.join(__dirname, 'views'))
//this will parse all the incoming request into a format that will. is an NPM package that parses incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.urlencoded({ extended: true }))
//middleware for overriding methods
app.use(methodOverride('_method'))
mongoose.set('strictQuery', false)


const sessionConfig = {
    store: MongoStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 3600 // time period in seconds
    }),
    name: 'session',
    secret: "thisissecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

//middleware for session
const secret = process.env.SECRET || 'thisisasecret'
app.use(session(sessionConfig))
app.use(express.static(path.join(__dirname, 'public')))
//Npm package that will flash a message one time, usually for logging in,deleting something, etc...
app.use(flash());
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(mongoSanitize());

//this is a middleware that stores a message and flash it on the browser. Order matters it should be after the app.use(flash())
app.use((req, res, next) => {
    // console.log(req.session)
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

//SECURITY FOR HEADERS

// app.use(
//     helmet({
//         contentSecurityPolicy: false,
//     })
// );



//router, The first argument which is the '/' is a prefix. You can change that into a '/products' then delete the '/products' in the router file
const products = require('./router/products')
app.use('/cookies', products)
//review router
const review = require('./router/review')
app.use('/campgrounds/:id/reviews', review)
//user router
const user = require('./router/user')
app.use('/', user)









const appError = require('./utils/appError');
const { rmSync } = require('fs');



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
//By default, MongoDB creates an _id property on every document that's of type ObjectId.so you cannot use the "=="when you want to compare  the values of the two objectId, that is why we use .equals()
//Converting the objectId to string will do the work to compare both objectId's
// const isAuthorize = async (req, res, next) => {
//     const { id } = req.params
//     const findC = await Campground.findById(id)
//     if (findC.author.toString() !== req.user._id.toString()) {
//         req.flash('error', 'Sorry you are not authorize to edit this')
//         res.redirect(`/ campgrounds / ${findC._id} `)
//     }
//     else {
//         next()
//     }
// }




app.get('/', (req, res,) => {
    res.render('campgrounds/home.ejs')
})


//campgrounds index page
app.get('/campgrounds', async (req, res, next) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })

})
//adding campgrounds
app.get('/campgrounds/newC', requireLogin, (req, res) => {
    if (requireLogin) {
        res.render('campgrounds/newCampground')
    }

})

//Middleware to validate a campground data before even inserting it in mongoDB
const validateCampground = (req, res, next) => {
    const result = campgroundSchema.validate(req.body)
    if (result.error) {
        throw new AppError(`${result.error.message} `, 401);
    }
    else {
        next()
    }
}

app.post('/campgrounds', upload.array('image', 10), validateCampground, wrapAsync(async (req, res, next) => {
    const geoData = await mbxGeocoder.forwardGeocode({
        query: req.body.location,
        limit: 1
    }).send()
    const { title, location, price, description, images } = req.body
    const data = req.files.map(f => {
        return {
            url: f.path,
            filename: f.filename
        }
    })
    const new1 = new Campground({ title: title, images: data, price: price, description: description, location: location })
    new1.geometry = geoData.body.features[0].geometry
    new1.author = req.user
    await new1.save()
    req.flash('success', 'Successfully added a campground')
    res.redirect(`/campgrounds/${new1._id}`)
}))





//details page
app.get('/campgrounds/:id', wrapAsync(async (req, res, next) => {
    const { id } = req.params
    const searchID = await Campground.findById(id).populate({
        path: 'reviews',
        populate: 'author'
    })
        .populate('author')

    if (!searchID) {
        req.flash('error', 'Campground not found')
        res.redirect('/campgrounds')
    }
    else {
        res.render('campgrounds/details', { searchID })
    }
}))


// editing campgrounds
app.get('/campgrounds/:id/edit', requireLogin, isAuthor, wrapAsync(async (req, res) => {
    const searchResult = await Campground.findById(req.params.id)
    if (!searchResult) {
        req.flash('error', 'Campground not found')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { searchResult })

}))

app.patch('/campgrounds/:id', isAuthor, upload.array('image', 10), validateCampground, wrapAsync(async (req, res, next) => {
    const { title, location, price, description } = req.body
    const update = await Campground.findOneAndUpdate(req.params.id, { title: title, location: location, price: price, description: description })
    const data = req.files.map(f => {
        return {
            url: f.path,
            filename: f.filename
        }
    })
    const findID = await Campground.findById(req.params.id)
    await findID.images.push(...data)//instead of passing the entire array, since req.files is giving an array but we just wanna get the data we use ...spread
    await findID.save()
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            cloudinary.uploader.destroy(filename)
        }
        await update.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } }) //this query will delete image from the mongo 
    }
    req.flash('success', 'Sucessfully edited a Campground')
    res.redirect(`/campgrounds/${update._id}`)

}))

//deleting campground
app.delete('/campgrounds/:id', requireLogin, isAuthor, async (req, res) => {
    const deleteItem = await Campground.findByIdAndDelete(req.params.id)
    //this is how you delete all the Reviews in 1 Campground
    // const cIds = deleteItem.reviews.map(c => c._id)
    // console.log(cIds)
    // await Review.deleteMany({ _id: { $in: cIds } })
    req.flash('success', 'Successfully deleted a campground')
    res.redirect('/campgrounds')



})

//developer page
app.get('/about', (req, res) => {
    res.render('campgrounds/developer')
})
app.post('/about', async (req, res, next) => {
    const { name, email, comment } = req.body
    const contact = await new About({
        name: name,
        email: email,
        comment: comment
    })
    contact.save()
    req.flash('success', 'Thank You for contacting me, I will get back to you as soon as I can')
    res.redirect('/campgrounds')
})



// //error handling for routes that are not valid
app.all('*', (req, res, next) => {
    next(new AppError('Page not found', 404))
})




// error handling middleware
app.use((err, req, res, next) => {
    const { status = 500, message = 'page not found' } = err
    res.render('campgrounds/errorpage', { err })
})













//this is use to confirm that our server is up and running
const port = process.env.port || 3000
app.listen(port, () => {
    console.log('listening to 3000!')
})




