const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const authRoute = require('./routes/auth');
const customizeRoute = require('./routes/customize');
const profileRoute = require('./routes/profile');
const adminRoute = require('./routes/admin');

mongoose.connect('mongodb+srv://stylehint:sneakers36.@cluster0-lzzhs.mongodb.net/stylehint?retryWrites=true&w=majority', {useNewUrlParser: true}, err => {
    err ? console.log('Can not connect to database') : console.log('Connected to database');
})


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));

app.use('/api/auth', authRoute);
app.use('/api/customize', customizeRoute);
app.use('/api/profile', profileRoute);
app.use('/api/admin', adminRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to port');   
    }
})