const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStats
} = require('../controllers/classController');
const {
  getStudents,
  addStudent,
  updateStudent,
  removeStudent,
  importStudents,
  upload
} = require('../controllers/studentController');

const router = express.Router();

// All class routes require instructor authentication
router.use(instructorAuth);

// Class routes
router.get('/', getClasses);
router.get('/stats', getClassStats);
router.post('/', createClass);
router.get('/:id', getClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// Student routes within classes
router.get('/:classId/students', getStudents);
router.post('/:classId/students', addStudent);
router.put('/:classId/students/:studentId', updateStudent);
router.delete('/:classId/students/:studentId', removeStudent);
router.post('/:classId/students/import', upload.single('csvFile'), importStudents);

module.exports = router;