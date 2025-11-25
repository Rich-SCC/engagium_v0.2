const StudentTag = require('../models/StudentTag');
const Student = require('../models/Student');
const Class = require('../models/Class');

// Get all tags for a class
const getClassTags = async (req, res) => {
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

    const tags = await StudentTag.findByClassId(classId);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get class tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create a new tag
const createTag = async (req, res) => {
  try {
    const { classId } = req.params;
    const { tag_name, tag_color } = req.body;

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

    if (!tag_name) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required'
      });
    }

    const tag = await StudentTag.create({
      class_id: classId,
      tag_name,
      tag_color: tag_color || '#3B82F6'
    });

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('Create tag error:', error);

    if (error.message === 'Tag name already exists in this class') {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists in this class'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update a tag
const updateTag = async (req, res) => {
  try {
    const { classId, tagId } = req.params;
    const { tag_name, tag_color } = req.body;

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

    // Verify tag belongs to this class
    const tag = await StudentTag.findById(tagId);
    if (!tag || tag.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const updatedTag = await StudentTag.update(tagId, {
      tag_name,
      tag_color
    });

    res.json({
      success: true,
      data: updatedTag
    });
  } catch (error) {
    console.error('Update tag error:', error);

    if (error.message === 'Tag name already exists in this class') {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists in this class'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete a tag
const deleteTag = async (req, res) => {
  try {
    const { classId, tagId } = req.params;

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

    // Verify tag belongs to this class
    const tag = await StudentTag.findById(tagId);
    if (!tag || tag.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    await StudentTag.delete(tagId);

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Assign tag to student
const assignTagToStudent = async (req, res) => {
  try {
    const { classId, studentId, tagId } = req.params;

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

    // Verify student belongs to this class
    const student = await Student.findById(studentId);
    if (!student || student.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Verify tag belongs to this class
    const tag = await StudentTag.findById(tagId);
    if (!tag || tag.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    await StudentTag.assignToStudent(studentId, tagId);

    res.json({
      success: true,
      message: 'Tag assigned to student'
    });
  } catch (error) {
    console.error('Assign tag error:', error);

    if (error.message === 'Student already has this tag') {
      return res.status(400).json({
        success: false,
        error: 'Student already has this tag'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Remove tag from student
const removeTagFromStudent = async (req, res) => {
  try {
    const { classId, studentId, tagId } = req.params;

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

    await StudentTag.removeFromStudent(studentId, tagId);

    res.json({
      success: true,
      message: 'Tag removed from student'
    });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Bulk assign tag to multiple students
const bulkAssignTag = async (req, res) => {
  try {
    const { classId, tagId } = req.params;
    const { student_ids } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'student_ids array is required'
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

    // Verify tag belongs to this class
    const tag = await StudentTag.findById(tagId);
    if (!tag || tag.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const assignments = await StudentTag.bulkAssign(student_ids, tagId);

    res.json({
      success: true,
      data: {
        assigned_count: assignments.length,
        assignments
      }
    });
  } catch (error) {
    console.error('Bulk assign tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Bulk remove tag from multiple students
const bulkRemoveTag = async (req, res) => {
  try {
    const { classId, tagId } = req.params;
    const { student_ids } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'student_ids array is required'
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

    const removedCount = await StudentTag.bulkRemove(student_ids, tagId);

    res.json({
      success: true,
      data: {
        removed_count: removedCount
      }
    });
  } catch (error) {
    console.error('Bulk remove tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get student's tags
const getStudentTags = async (req, res) => {
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

    const tags = await StudentTag.getStudentTags(studentId);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get student tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getClassTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagToStudent,
  removeTagFromStudent,
  bulkAssignTag,
  bulkRemoveTag,
  getStudentTags
};
