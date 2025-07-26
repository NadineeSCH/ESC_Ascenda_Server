var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);

// catch 404 and forward to error handler
// catch all requests that did not match any defined route
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
/* original error handler for rendering front end views

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/

// error handling for backend with no views
app.use(function(err, req, res, next) {
  const errorResponse = {
    message: err.message
  };

  if (req.app.get('env') === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json({ error: errorResponse });
});

module.exports = app;
