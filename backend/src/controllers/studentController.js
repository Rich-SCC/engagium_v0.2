const Student = require('../models/Student');
const Class = require('../models/Class');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Get all students in a class
const getStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { 
      search, 
      sortBy, 
      sortOrder, 
      tagIds, 
      hasNotes,
      limit,
      offset
    } = req.query;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Use advanced search if filters provided, otherwise simple list
    let students;
    if (search || sortBy || tagIds || hasNotes !== undefined) {
      const options = {
        search,
        sortBy: sortBy || 'last_name',
        sortOrder: sortOrder || 'ASC',
        tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : [],
        hasNotes: hasNotes !== undefined ? hasNotes === 'true' : null,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : 0
      };

      students = await Student.searchAndFilter(classId, options);
    } else {
      students = await Student.findByClassId(classId);
    }

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Add single student to class
const addStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { first_name, last_name, email, student_id } = req.body;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    const student = await Student.create({
      class_id: classId,
      first_name,
      last_name,
      email,
      student_id
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Add student error:', error);

    if (error.message === 'Student ID already exists in this class') {
      return res.status(400).json({
        success: false,
        error: 'Student ID already exists in this class'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { first_name, last_name, email, student_id: new_student_id } = req.body;

    // Verify student exists and has access to class
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    if (student.class_id !== classId) {
      return res.status(400).json({
        success: false,
        error: 'Student does not belong to this class'
      });
    }

    // Verify user has access to the class
    const classData = await Class.findById(classId);
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    const updatedStudent = await Student.update(studentId, {
      first_name,
      last_name,
      email,
      student_id: new_student_id
    });

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);

    if (error.message === 'Student ID already exists in this class') {
      return res.status(400).json({
        success: false,
        error: 'Student ID already exists in this class'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Remove student from class
const removeStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Verify student exists and has access to class
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    if (student.class_id !== classId) {
      return res.status(400).json({
        success: false,
        error: 'Student does not belong to this class'
      });
    }

    // Verify user has access to the class
    const classData = await Class.findById(classId);
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await Student.delete(studentId);

    res.json({
      success: true,
      message: 'Student removed successfully'
    });
  } catch (error) {
    console.error('Remove student error:', error);

    if (error.message === 'Cannot delete student with participation logs') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete student with participation logs'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Import students from CSV
const importStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file provided'
      });
    }

    // Parse CSV file from buffer
    const students = [];
    const errors = [];

    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Auto-detect and map columns (case-insensitive)
          const mappedRow = {};
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey.includes('first') && lowerKey.includes('name')) {
              mappedRow.first_name = row[key];
            } else if (lowerKey.includes('last') && lowerKey.includes('name')) {
              mappedRow.last_name = row[key];
            } else if (lowerKey.includes('email')) {
              mappedRow.email = row[key];
            } else if (lowerKey.includes('student') && lowerKey.includes('id')) {
              mappedRow.student_id = row[key];
            } else if (lowerKey === 'first name' || lowerKey === 'firstname') {
              mappedRow.first_name = row[key];
            } else if (lowerKey === 'last name' || lowerKey === 'lastname') {
              mappedRow.last_name = row[key];
            } else if (lowerKey === 'id') {
              mappedRow.student_id = row[key];
            }
          });

          // Validate required fields
          if (mappedRow.first_name && mappedRow.last_name) {
            students.push({
              class_id: classId,
              first_name: mappedRow.first_name.trim(),
              last_name: mappedRow.last_name.trim(),
              email: mappedRow.email ? mappedRow.email.trim() : null,
              student_id: mappedRow.student_id ? mappedRow.student_id.trim() : null
            });
          } else {
            errors.push({
              row: students.length + errors.length + 1,
              data: row,
              error: 'Missing required fields: first_name and last_name'
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid student data found in CSV file'
      });
    }

    // Bulk create students
    const results = await Student.bulkCreate(students);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(201).json({
      success: true,
      data: {
        imported: successful.length,
        failed: failed.length,
        errors: failed,
        parsing_errors: errors,
        total_processed: students.length
      }
    });
  } catch (error) {
    console.error('Import students error:', error);

    if (error.message === 'Only CSV files are allowed') {
      return res.status(400).json({
        success: false,
        error: 'Only CSV files are allowed'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Bulk delete students
const bulkDeleteStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_ids } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'student_ids array is required'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(classId);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const deletedCount = await Student.bulkDelete(student_ids);

    res.json({
      success: true,
      message: `${deletedCount} student(s) deleted successfully`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Bulk delete students error:', error);
    
    if (error.message.includes('participation logs')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Export students to CSV
const exportStudentsCSV = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const existingClass = await Class.findById(classId);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const csv = await Student.exportToCSV(classId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students_${classId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export students CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getStudents,
  addStudent,
  updateStudent,
  removeStudent,
  importStudents,
  bulkDeleteStudents,
  exportStudentsCSV,
  upload
};

// Get student with detailed info
const getStudentDetails = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const student = await Student.findByIdWithDetails(studentId);

    if (!student || student.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Check for duplicate students
const checkDuplicates = async (req, res) => {
  try {
    const { classId } = req.params;
    const { email, student_id } = req.query;

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const duplicates = await Student.findDuplicates(classId, email, student_id);

    res.json({
      success: true,
      data: {
        has_duplicates: duplicates.length > 0,
        duplicates
      }
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Merge two students
const mergeStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { keep_student_id, merge_student_id } = req.body;

    if (!keep_student_id || !merge_student_id) {
      return res.status(400).json({
        success: false,
        error: 'Both keep_student_id and merge_student_id are required'
      });
    }

    if (keep_student_id === merge_student_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot merge a student with itself'
      });
    }

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Verify both students belong to this class
    const keepStudent = await Student.findById(keep_student_id);
    const mergeStudent = await Student.findById(merge_student_id);

    if (!keepStudent || keepStudent.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Keep student not found in this class'
      });
    }

    if (!mergeStudent || mergeStudent.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Merge student not found in this class'
      });
    }

    const mergedStudent = await Student.merge(keep_student_id, merge_student_id);

    res.json({
      success: true,
      data: mergedStudent,
      message: 'Students merged successfully'
    });
  } catch (error) {
    console.error('Merge students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Bulk update students
const bulkUpdateStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'updates array is required'
      });
    }

    // Verify class exists and user has access
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const results = await Student.bulkUpdate(updates);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        updated: successful.length,
        failed: failed.length,
        results
      }
    });
  } catch (error) {
    console.error('Bulk update students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
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
};