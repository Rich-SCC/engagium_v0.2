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
  getStudentDetails,
  addStudent,
  updateStudent,
  removeStudent,
  importStudents,
  bulkDeleteStudents,
  exportStudentsCSV,
  checkDuplicates,
  mergeStudents,
  bulkUpdateStudents,
  upload
} = require('../controllers/studentController');
const {
  getClassTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagToStudent,
  removeTagFromStudent,
  bulkAssignTag,
  bulkRemoveTag,
  getStudentTags
} = require('../controllers/studentTagController');
const {
  getStudentNotes,
  createNote,
  updateNote,
  deleteNote,
  getRecentClassNotes
} = require('../controllers/studentNoteController');
const {
  getClassSessions
} = require('../controllers/sessionController');

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

// Class sessions
router.get('/:classId/sessions', getClassSessions);

// Student routes within classes
router.get('/:classId/students', getStudents);
router.get('/:classId/students/check-duplicates', checkDuplicates);
router.get('/:classId/students/export', exportStudentsCSV);
router.get('/:classId/students/:studentId', getStudentDetails);
router.post('/:classId/students', addStudent);
router.put('/:classId/students/:studentId', updateStudent);
router.delete('/:classId/students/:studentId', removeStudent);
router.post('/:classId/students/import', upload.single('csvFile'), importStudents);
router.post('/:classId/students/bulk-delete', bulkDeleteStudents);
router.post('/:classId/students/bulk-update', bulkUpdateStudents);
router.post('/:classId/students/merge', mergeStudents);

// Student tags routes
router.get('/:classId/tags', getClassTags);
router.post('/:classId/tags', createTag);
router.put('/:classId/tags/:tagId', updateTag);
router.delete('/:classId/tags/:tagId', deleteTag);
router.get('/:classId/students/:studentId/tags', getStudentTags);
router.post('/:classId/students/:studentId/tags/:tagId', assignTagToStudent);
router.delete('/:classId/students/:studentId/tags/:tagId', removeTagFromStudent);
router.post('/:classId/tags/:tagId/bulk-assign', bulkAssignTag);
router.post('/:classId/tags/:tagId/bulk-remove', bulkRemoveTag);

// Student notes routes
router.get('/:classId/notes/recent', getRecentClassNotes);
router.get('/:classId/students/:studentId/notes', getStudentNotes);
router.post('/:classId/students/:studentId/notes', createNote);
router.put('/:classId/students/:studentId/notes/:noteId', updateNote);
router.delete('/:classId/students/:studentId/notes/:noteId', deleteNote);

module.exports = router;