var express      = require('express');
var http         = require('http');
var path         = require('path');
var favicon      = require('serve-favicon');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var flash        = require('connect-flash');
var mongoose     = require('mongoose');
var bluebird     = require('bluebird');
var passport     = require('passport');
var Strategy     = require('passport-local').Strategy;
var hbs          = require('hbs');
var stylus       = require('express-stylus');
var redis        = require("redis");
var MongoStore   = require('connect-mongo')(session);

var config       = require('./config');

var User         = require('./models/user');
var ioserver     = require('./utility/io');

var homepage     = require('./routes/homepage');
var api          = require('./routes/api');
var signUp       = require('./routes/signup');
var login        = require('./routes/login');
var logout       = require('./routes/logout');
var user         = require('./routes/user');
var edit         = require('./routes/edit');
var search       = require('./routes/search');
var game         = require('./routes/game');
var messages     = require('./routes/messages');

var app = express();

var server = http.createServer(app);

var public = path.join(__dirname, 'public');

//Express
app.use(favicon(path.join(public, 'favicon.ico')));
app.use(express.static(public));
app.set('port',(process.env.PORT || 3000));

app.enable('case sensitive routing');
app.disable('x-powered-by');

//Morgan
app.use(morgan('dev'));

//Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
hbs.registerHelper('config', function(variable) {
  return config[variable];
});

//BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//CookieParser
app.use(cookieParser());

//Flash
app.use(flash());

//Mongoose
mongoose.Promise = bluebird;
if(app.get('env')==='production'){
  app.listen(app.get('port'));
  //NOTE: You have to run heroku config first to set this environment variable
  //otherwise it defaults to the config file in config.mongooseUri
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(config.mongooseUri);
}

//Session
var sessionMiddleware = session({
  store: new MongoStore({
    url: config.mongooseUri
  }),
  secret: config.passportSecret,
  resave: false,
  saveUninitialized: false
});

app.use(sessionMiddleware);

//io set up
var io = require('socket.io')(server);

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

ioserver.run(io);

//Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Routes
app.use('/', homepage);
app.use('/api', api);
app.use('/signup', signUp);
app.use('/login', login);
app.use('/logout', logout);
app.use('/user', user);
app.use('/user', edit);
app.use('/search', search);
app.use('/game', game);
app.use('/messages', messages);

//Stylus
app.use(stylus({
  src: path.join(public, "stylesheets")
}));

//404 error handler
app.use(function(req, res, next) {
  res.status(404);
  res.render('404', {
    title: 'WASD With Me - Page not found!',
    layout: 'primary',
    file: '404',
    user : req.user,
    message: "Page you are looking for could not be found."
  });
});

//Development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//Production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = {
  app: app,
  server: server
};