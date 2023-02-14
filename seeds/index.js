const mongoose = require('mongoose')
const Campground = require('../models/campground')
const cities = require('./cities')
const seedHelpers = require('./seedhelpers')
const { places, descriptors } = seedHelpers
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
    .then(() => {
        console.log("connection Open")
    })
    .catch((e) => {
        console.log("oh no error")
        console.log(e)
    })


const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 20; i++) {
        const rand1000 = Math.floor(Math.random() * 1000)
        const new1 = new Campground({
            author: '634705229d9d7b3ed083cd67'
            , location: `${cities[rand1000].city},${cities[rand1000].state}`
            , title: `${descriptors[Math.floor(Math.random() * descriptors.length)]},${places[Math.floor(Math.random() * places.length)]}`
            , images: [{
                url: 'https://res.cloudinary.com/dkjbwe6js/image/upload/v1666197132/YelpCamp/oguxj6z7fm2hmyeyc0ye.jpg',
                filename: 'YelpCamp/oguxj6z7fm2hmyeyc0ye'
            },
            {
                url: 'https://res.cloudinary.com/dkjbwe6js/image/upload/v1666197132/YelpCamp/rqn0mv25zteizbedwqyw.jpg',
                filename: 'YelpCamp/rqn0mv25zteizbedwqyw'
            }
            ]
            , price: `${rand1000}`
            , description: `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nisi laboriosam, est et qui nihil quisquam, laudantium vitae cumque magnam optio ipsa blanditiis accusantium, adipisci quae facere ullam itaque minima suscipit.`

        })

        await new1.save()
    }
}
seedDB()
    .then(() => {
        mongoose.connection.close()
    })


