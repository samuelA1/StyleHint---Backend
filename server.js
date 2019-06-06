const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

mongoose.connect(config.db, {useNewUrlParser: true}, err => {
    err ? console.log('Can not connect to database') : console.log('Connected to database');
})


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));

app.listen(config.port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to port');   
    }
})