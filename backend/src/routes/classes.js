const express = require('express');
const { instructorAuth } = require('../middleware/auth');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStats,
  updateClassStatus,
  updateClassSchedule,
  getClassLinks,
  addClassLink,
  updateClassLink,
  deleteClassLink,
  getExemptedAccounts,
  addExemptedAccount,
  deleteExemptedAccount
} = require('../controllers/classController');
const {
  getStudents,
  addStudent,
  updateStudent,
  removeStudent,
  importStudents,
  bulkDeleteStudents,
  exportStudentsCSV,
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

// Class status and schedule
router.patch('/:id/status', updateClassStatus);
router.patch('/:id/schedule', updateClassSchedule);

// Session links
router.get('/:id/links', getClassLinks);
router.post('/:id/links', addClassLink);
router.put('/:id/links/:linkId', updateClassLink);
router.delete('/:id/links/:linkId', deleteClassLink);

// Exempted accounts
router.get('/:id/exemptions', getExemptedAccounts);
router.post('/:id/exemptions', addExemptedAccount);
router.delete('/:id/exemptions/:exemptionId', deleteExemptedAccount);

// Student routes within classes
router.get('/:classId/students', getStudents);
router.post('/:classId/students', addStudent);
router.put('/:classId/students/:studentId', updateStudent);
router.delete('/:classId/students/:studentId', removeStudent);
router.post('/:classId/students/import', upload.single('csvFile'), importStudents);
router.post('/:classId/students/bulk-delete', bulkDeleteStudents);
router.get('/:classId/students/export', exportStudentsCSV);

module.exports = router;