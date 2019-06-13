'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./models').sequelize;


// Routes file
const routes = require('./routes/routes');

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// json middleware — helps with being able to use req.body in handlers
app.use(express.json());

// set port
const port = process.env.PORT || 5000;

// Test the DB connection
console.log('Testing the connection to the database...');
sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.')
}).then(() => {
  app.listen(port, () => {
    console.log(`Express server is listening on port ${port}`)
  });
}).catch(err => {
  err.message("Looks like there was a problem connecting to the database.");
  console.log(err);
});

// Root route redirect to the '/users' route
app.get('/', (req, res) => {
  res.redirect('api/courses');
});

// Routes with '/api' prefix added
app.use('/api', routes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  // Array to hold error messages caught by global error handler
  let errMsgs = [];

  // If error - map errors and push messages to array
  if (err) {
    console.log("error name: " + (err.name));
    if (err.errors) {
      err.errors.map(err => {
        errMsgs.push(err.message);
      });
    } else {
      errMsgs = err.message;
    }

    // Set error status to 400 if necessary
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      err.status = 400;
    }
  }

  res.status(err.status || 500).json({
    message: errMsgs
  });
});

// start listening on our port
app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${port}`);
});
