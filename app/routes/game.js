var express = require('express');
var router = express.Router();

var Game   = require('../models/game');
var config = require('../config');
var Logger = require('../utility/logger');
var data   = require('../utility/data');

//You should not be able to access /game/ directly
router.get('/', function(req, res, next) {
    return res.redirect("/");
});

//handles GET requests to /game/
router.get('/:game', function(req, res, next) {
    var query = decodeURI(req.params.game);

    if (query.length < 1){
        return;
    }

    query = getCleanedName(query);

    console.log(query);

    var gameQuery = {
        "name": {
            $regex : query + ".*"
        }
    };

    Game.findOne(gameQuery, function(err, game) {

        if (err){
            Logger.log("Searching for game " + query + " failed.", err);
        }

        if (!game){
            data.callApi(req, res, query, [], displayGame);
            return;
        }

        displayGame(req, res, query, game);
    });
});

//Display a single game
function displayGame(req, res, query, game){

    //Display Game can be called either with a single game (if found by db)
    //or an array of length 1 (if found by api) so the follow code is needed

    if(Array.isArray(game)){
        if(game.length < 1){
            return gameNotFound(req, res, query);
        }
        game = game[0];
    }

    var release = getReleaseDate(game.release_date);
    var banner = getBanner(game.screenshots);
    var rating = getRating(game.rating);

    return res.render('game', {
        title: game.display_name,
        layout: 'primary',
        file: 'game',
        user : req.user,
        game: game,
        release: release,
        banner: banner,
        rating: rating
    });
}

function getReleaseDate(releaseDate){
    if (releaseDate) {
        var date = releaseDate;
        var locale = "en-us";
        var month = date.toLocaleString(locale, {month: "long"});

        return month + " " + date.getDate() + ", " + date.getFullYear();
    }
}

function getBanner(screenshots){
    if (screenshots){
        //select a random screenshot as the game banner
        return screenshots[Math.floor(Math.random() * screenshots.length)];
    }
}

function getRating(rating){
    if (rating && rating > 0){
        //Set the rating as an int with a corresponding color
        var ratingObj = {};
        ratingObj.number = Math.ceil(rating);
        if (ratingObj.number > 80){
            ratingObj.color = "limegreen";
        } else if (ratingObj.number > 60) {
            ratingObj.color = "goldenrod";
        } else {
            ratingObj.color = "firebrick";
        }
        return ratingObj;
    }
}

//cleans up a game name of edge-case characters
function getCleanedName(name){
    var ret = name
        .toLowerCase()
        .replace('é', 'e')
        .replace('&', 'and');
    return ret;
}

//called when a game was not found
function gameNotFound(req, res, query){
    res.status(404);
    res.render('404', {
        title: 'Game not found!',
        layout: 'primary',
        file: '404',
        user: req.user,
        message: query + " not found!"
    });
}

module.exports = router;
