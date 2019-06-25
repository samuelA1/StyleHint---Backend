const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const searchRoutes = require('./routes/search');
const authRoute = require('./routes/auth');
const customizeRoute = require('./routes/customize');
const profileRoute = require('./routes/profile');
const adminRoute = require('./routes/admin');
const hintsRoute = require('./routes/hints');
const friendsRoute = require('./routes/friends');
const tipsRoute = require('./routes/tips');
const closetRoute = require('./routes/closets');
const notificationsRoute = require('./routes/notifications');

mongoose.connect(config.db, {useNewUrlParser: true}, err => {
    err ? console.log('Can not connect to database') : console.log('Connected to database');
})


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
require('./socket')(io);

app.use('/api/auth', authRoute);
app.use('/api/customize', customizeRoute);
app.use('/api/profile', profileRoute);
app.use('/api/admin', adminRoute);
app.use('/api/hints', hintsRoute);
app.use('/api/friends', friendsRoute);
app.use('/api/tips', tipsRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/closet', closetRoute);
app.use('/api/search', searchRoutes);



server.listen(config.port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to port');   
    }
})