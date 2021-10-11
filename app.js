var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var fileUpload = require('express-fileupload')
var db = require('./config/connection')
const passport = require('passport')
var app = express();
const session = require('express-session')
const Razorpay = require('razorpay')




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutDir: __dirname + 'views/layouts/', partialDir: __dirname + 'views/partials/' }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({ secret: "key", cookie: { maxAge: 600000 } }))
// Passport middleware
app.use(passport.initialize())
app.use(passport.session())
// Passport config
require('./config/passport')(passport)

db.connect((err) => {
  if (err)
    console.log("Connection error");
  else
    console.log('database connected');
})
app.use('/', usersRouter);
app.use('/admin', adminRouter);




app.use((req, res, next) => {

  res.status(404).render('user/404',{layout:null})
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;


