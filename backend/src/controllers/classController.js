const Class = require('../models/Class');

// Get all classes for current instructor
const getClasses = async (req, res) => {
  try {
    const classes = await Class.findByInstructorId(req.user.id);

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get single class with details
const getClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (classData.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const { name, subject, section, description } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required'
      });
    }

    const classData = await Class.create({
      instructor_id: req.user.id,
      name,
      subject,
      section,
      description
    });

    res.status(201).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, section, description } = req.body;

    // First get the class to check ownership
    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required'
      });
    }

    const updatedClass = await Class.update(id, {
      name,
      subject,
      section,
      description
    });

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the class to check ownership
    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if user owns this class
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await Class.delete(id);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);

    if (error.message === 'Cannot delete class with existing sessions') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete class with existing sessions'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get class statistics
const getClassStats = async (req, res) => {
  try {
    const classes = await Class.findByInstructorId(req.user.id);
    const stats = {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, cls) => sum + parseInt(cls.student_count || 0), 0),
      recentClasses: classes.slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStats
};