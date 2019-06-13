'use strict';

const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');
const User = require('../models').User;

exports.authenticateUser = (req, res, next) => {
  let message = [];

  const credentials = auth(req);

  if (credentials) {

    User.findOne({ where: { emailAddress: credentials.name } }).then(user => {
      if (user) {
        const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

        // Resolve happy path
        if (authenticated) {
          console.info(`Authentication successful for email address: ${user.emailAddress}`);
          const userValues = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
          };
          req.currentUser = userValues;

        // Else handle errors
        } else {
          message.push(`Authentication failure for username: ${user.emailAddress}`);
        }
      } else {
        message.push(`User not found for username: ${credentials.name}`);
      }

      if (message.length > 0) {
        console.warn(message);
        res.status(401).json({ message });
      } else {
        next();
      }
    });
  } else {
    message = 'Auth header not found';
    if (message.length > 0) {
      console.warn(message);
      res.status(401).json({ message });
    } else {
      next();
    }
  }
};