'use strict';

const express = require("express");
const router = express.Router();
const User = require('../models').User;
const Course = require('../models').Course;
const bcryptjs = require('bcryptjs');
const authenticateUser = require('./auth').authenticateUser;


function userCreate(body) {
  body.password = bcryptjs.hashSync(body.password);
  return {
    firstName: body.firstName,
    lastName: body.lastName,
    emailAddress: body.emailAddress,
    password: body.password
  }
}

// get /api/users - 200 - Returns the currently authenticated user (including the courses created by user)
router.get('/users', authenticateUser, (req, res, next) => {
  const user = req.currentUser;
  console.log(user.include);
  res.json({
    id: user.id,
    firstName: user.emailAddress,
    lastName: user.lastName,
    emailAddress: user.emailAddress,
    include: [
      {
        model: Course,
        as: 'creator',
      },
    ],
  });
});


// post /api/users - 201 - Creates a user, sets the Location header to "/", and returns no content - validation handled in global error handler
router.post('/users', (req, res, next) => {
  User.create(userCreate(req.body)).then(() => {
    return res.location('/').status(201).end();
  }).catch(err => {
    next(err); 
  });
});

module.exports = router;