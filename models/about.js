const mongoose = require('mongoose')
const Schema = mongoose.Schema

const aboutSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    comment: {
        type: String,
        require: true,
    }
})

const About = mongoose.model('About', aboutSchema)

module.exports = About