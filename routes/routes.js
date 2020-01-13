'use strict';

const express = require("express");
const router = express.Router();
const { User, Course } = require('../models');
const bcryptjs = require('bcryptjs');
const authenticateUser = require('./auth').authenticateUser;

/* Helpers */
function userCreate(body) {
  body.password = bcryptjs.hashSync(body.password);
  return {
    firstName: body.firstName,
    lastName: body.lastName,
    emailAddress: body.emailAddress,
    password: body.password
  }
}

const CourseAttributes = ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'];

const CourseInclude = [
  {
    model: User,
    attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
    as: 'creator',
  },
];

const CourseWithAttributesAndIncludes = {
  attributes: CourseAttributes,
  include: CourseInclude,
}

function courseAttributesObject(body) {
  return {
    title: body.title,
    description: body.description,
    estimatedTime: body.estimatedTime,
    materialsNeeded: body.materialsNeeded,
    userId: body.userId
  }
}
/* end helpers */

/* Routes */
// get /api/users - 200 - Returns the currently authenticated user (including the courses created by user)
router.get('/users', authenticateUser, (req, res, next) => {
  const user = req.currentUser;
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
    res.location('/').status(201).end();
  }).catch(err => {
    next(err); 
  });
});


// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get('/courses', (req, res, next) => {
  Course.findAll(CourseWithAttributesAndIncludes).then(courses => {
    console.log(courses);
    res.status(200).json(courses);
  }).catch(err => {
    next(err);
  });
});


// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get('/courses/:id', (req, res, next) => {
  const id = req.params.id;
  Course.findByPk(id, CourseWithAttributesAndIncludes).then(course => {
    course ? res.status(200).json(course) : res.status(400).json({error: "No such course"});    
  }).catch(err => {
    next(err);
  });
});


// POST /api/courses 201 - Authenticates user, creates a course, sets the Location header to the URI for the course, and returns no content - validation handled in global error handler
router.post('/courses', authenticateUser, (req, res, next) => {
  const body = req.body;
  Course.findOne({
    where: {
      title: body.title
    }
  }).then((course) => {
    if (course) {
      console.log("Course already exists");
      res.location('/').status(400).json({ error: "Course already exists" });;
    } else {
      Course.create(courseAttributesObject(body)).then(() => {
        Course.findOne({
          where: {
            title: body.title
          }
        }).then((newCourse) => {
          res.location(`/courses/:${newCourse.id}`).status(201).end();
        }).catch(err => {
          next(err);
        });
      }).catch(err => {
        next(err);
      });
    }
  }).catch(err => {
    next(err);
  });
});

// PUT /api/courses/:id 204 - Authenticates user, updates a course and returns no content - validation handled in global error handler
router.put('/courses/:id', authenticateUser, (req, res, next) => {
  const user = req.currentUser;
  const id = req.params.id;
  const body = req.body;
  Course.findByPk(id).then(course => {
    if (course) {
      if (user.id === course.userId) {
        course.update(courseAttributesObject(body)).then(() => {
          res.location('/').status(204).end();
        }).catch(err => {
          next(err);
        });
      } else {
        res.location('/').status(403).json("Not your course, yo!");
      }
    } else {
      res.location('/').status(400).json("Course does not exist");
    }
  }).catch(err => {
    next(err);
  });
});


// DELETE /api/courses/:id 204 - Authenticates user, deletes a course and returns no content
router.delete('/courses/:id', authenticateUser, (req, res, next) => {
  const user = req.currentUser;
  const id = req.params.id; 
  Course.findByPk(id).then(course => {
    if (course) {
      if (user.id === course.userId) {
        course.destroy();
        res.location('/').status(204).end();
      } else {
        res.location('/').status(403).json("Not your course, yo!");
      }
    } else {
      res.location('/').status(400).json("Course does not exist");
    }
  }).catch(err => {
    next(err);
  });
});

module.exports = router;