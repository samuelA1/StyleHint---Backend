const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const Notification = require('../models/notification');
const async = require('async');