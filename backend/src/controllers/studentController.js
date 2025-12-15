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
        sortBy: sortBy || 'full_name',
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
    const { full_name } = req.body;

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
    if (!full_name) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required'
      });
    }

    const student = await Student.create({
      class_id: classId,
      full_name
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Add student error:', error);

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
    const { full_name } = req.body;

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
    if (!full_name) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required'
      });
    }

    const updatedStudent = await Student.update(studentId, {
      full_name
    });

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);

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
            if (lowerKey === 'full_name' || lowerKey === 'fullname' || lowerKey === 'name') {
              mappedRow.full_name = row[key];
            } else if (lowerKey.includes('first') && lowerKey.includes('name')) {
              mappedRow.first_name = row[key];
            } else if (lowerKey.includes('last') && lowerKey.includes('name')) {
              mappedRow.last_name = row[key];
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

          // Build full_name from available columns
          let fullName;
          if (mappedRow.full_name) {
            fullName = mappedRow.full_name.trim();
          } else if (mappedRow.first_name && mappedRow.last_name) {
            fullName = `${mappedRow.first_name.trim()} ${mappedRow.last_name.trim()}`;
          } else if (mappedRow.first_name) {
            fullName = mappedRow.first_name.trim();
          } else if (mappedRow.last_name) {
            fullName = mappedRow.last_name.trim();
          }

          // Validate required fields
          if (fullName) {
            students.push({
              class_id: classId,
              full_name: fullName,
              student_id: mappedRow.student_id ? mappedRow.student_id.trim() : null
            });
          } else {
            errors.push({
              row: students.length + errors.length + 1,
              data: row,
              error: 'Missing required field: full_name (or first_name/last_name)'
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
    const { full_name, student_id } = req.query;

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

    const duplicates = await Student.findDuplicates(classId, full_name, student_id);

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

// Bulk add students (for extension - unmapped participants)
const bulkAddStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'students array is required'
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

    // Map participants to students using full_name
    const studentsData = students.map(s => {
      let fullName;
      
      if (s.full_name) {
        // Already has full_name
        fullName = s.full_name;
      } else if (s.name) {
        // Use name field directly as full_name (Google Meet display name)
        fullName = s.name.trim();
      } else if (s.first_name && s.last_name) {
        // Legacy format - combine into full_name
        fullName = `${s.first_name} ${s.last_name}`.trim();
      } else {
        fullName = 'Unknown Participant';
      }
      
      return {
        class_id: classId,
        full_name: fullName,
        student_id: s.student_id || null
      };
    });

    // Bulk create students, skipping duplicates
    const results = await Student.bulkCreate(studentsData);

    const successful = results.filter(r => r.success);
    const newlyCreated = results.filter(r => r.success && !r.existing);
    const alreadyExisted = results.filter(r => r.success && r.existing);
    const failed = results.filter(r => !r.success);

    res.status(201).json({
      success: true,
      data: {
        added: newlyCreated.length,
        existing: alreadyExisted.length,
        failed: failed.length,
        students: successful.map(r => r.data),
        errors: failed
      }
    });
  } catch (error) {
    console.error('Bulk add students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create student from unmatched participant (quick add to roster)
const createFromParticipant = async (req, res) => {
  try {
    const { classId } = req.params;
    const { participant_name, session_id } = req.body;

    if (!participant_name) {
      return res.status(400).json({
        success: false,
        error: 'participant_name is required'
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

    // Create student from participant name
    const result = await Student.createFromParticipant(classId, participant_name);

    // If session_id provided, retroactively link attendance intervals/records
    if (session_id && result.created) {
      const AttendanceInterval = require('../models/AttendanceInterval');
      await AttendanceInterval.linkToStudent(session_id, participant_name, result.student.id);
    }

    res.status(result.created ? 201 : 200).json({
      success: true,
      data: result.student,
      created: result.created,
      message: result.created 
        ? 'Student created and added to roster' 
        : 'Student already exists in roster'
    });
  } catch (error) {
    console.error('Create from participant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get student analytics
const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Verify class access
    const classData = await Class.findById(student.class_id);
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const pool = require('../config/database');

    // Parse dates - extract just the date part for comparison
    const start = startDate ? new Date(startDate).toISOString().split('T')[0] : '2020-01-01';
    const end = endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Get session attendance history
    const sessionHistoryQuery = `
      SELECT 
        s.id,
        s.title,
        s.session_date,
        s.session_time,
        s.status,
        ar.status as attendance_status,
        ar.total_duration_minutes,
        ar.first_joined_at,
        ar.last_left_at,
        (
          SELECT json_agg(
            json_build_object(
              'joined_at', ai.joined_at,
              'left_at', ai.left_at,
              'duration_minutes', 
              CASE 
                WHEN ai.left_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (ai.left_at - ai.joined_at)) / 60
                ELSE NULL
              END
            )
            ORDER BY ai.joined_at
          )
          FROM attendance_intervals ai
          WHERE ai.session_id = s.id AND ai.student_id = $1
        ) as intervals
      FROM sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.student_id = $1
      WHERE s.class_id = $2
        AND s.session_date >= $3
        AND s.session_date <= $4
        AND s.status IN ('active', 'ended')
      ORDER BY s.session_date DESC, s.session_time DESC
    `;

    const sessionHistoryResult = await pool.query(sessionHistoryQuery, [studentId, student.class_id, start, end]);

    // Calculate overall statistics
    const totalSessions = sessionHistoryResult.rows.length;
    const sessionsAttended = sessionHistoryResult.rows.filter(s => s.attendance_status === 'present').length;
    const sessionsLate = sessionHistoryResult.rows.filter(s => s.attendance_status === 'late').length;
    const sessionsAbsent = sessionHistoryResult.rows.filter(s => s.attendance_status === 'absent' || !s.attendance_status).length;
    
    const totalDuration = sessionHistoryResult.rows.reduce((sum, s) => 
      sum + (parseFloat(s.total_duration_minutes) || 0), 0
    );
    
    const avgDuration = sessionsAttended > 0 ? (totalDuration / sessionsAttended).toFixed(2) : 0;
    const attendanceRate = totalSessions > 0 ? ((sessionsAttended / totalSessions) * 100).toFixed(2) : 0;

    // Get attendance timeline (daily summary)
    const timelineQuery = `
      SELECT 
        s.session_date as date,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as attended,
        COALESCE(SUM(ar.total_duration_minutes), 0) as total_duration
      FROM sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.student_id = $1
      WHERE s.class_id = $2
        AND s.session_date >= $3
        AND s.session_date <= $4
        AND s.status IN ('active', 'ended')
      GROUP BY s.session_date
      ORDER BY date ASC
    `;

    const timelineResult = await pool.query(timelineQuery, [studentId, student.class_id, start, end]);

    const overallStats = {
      totalSessions,
      sessionsAttended,
      sessionsLate,
      sessionsAbsent,
      attendanceRate: parseFloat(attendanceRate),
      totalDurationMinutes: totalDuration,
      avgDurationMinutes: parseFloat(avgDuration),
    };

    res.json({
      success: true,
      data: {
        student,
        class: classData,
        dateRange: { startDate: start, endDate: end },
        overallStats,
        sessionHistory: sessionHistoryResult.rows,
        timeline: timelineResult.rows,
      }
    });
  } catch (error) {
    console.error('Get student analytics error:', error);
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
  bulkAddStudents,
  createFromParticipant,
  getStudentAnalytics,
  upload
};