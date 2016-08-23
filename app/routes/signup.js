var express = require('express');
var router = express.Router();

var passport = require('passport');
var User = require('../models/user');

router.get('/', function(req, res, next) {
    res.render('signup', {
        title: 'wasdWithMe - Sign up!',
        layout: 'secondary',
        css: 'signup'
    });
});

router.post('/', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;
    var gender   = req.body.gender;
    var birthday = req.body.date_of_birth;
    var country  = req.body.country;
    var state    = req.body.state;
    var city     = req.body.city;

    var user = new User({
        username : username,
        password : password,
        email : email,
        gender : gender,
        birthday : birthday,
        country : country,
        state : state,
        city : city
    });

    User.register(user, password, function(err, user) {
        if (err) {
           //do something to handle error
            console.log("registering error occurred");
            return;
        }
        passport.authenticate('local', {
            successRedirect : '/',
            failureRedirect : '/signup',
            failureFlash : true
        })(req, res, function () {
            console.log("Authenticated successfully");
            res.redirect('/');
        });
    });
});

module.exports = router;
