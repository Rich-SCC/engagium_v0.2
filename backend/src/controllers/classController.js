const Class = require('../models/Class');
const SessionLink = require('../models/SessionLink');
const ExemptedAccount = require('../models/ExemptedAccount');

// Get all classes for current instructor
const getClasses = async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === 'true';
    const classes = await Class.findByInstructorId(req.user.id, includeArchived);

    // Fetch session links for each class
    const classesWithLinks = await Promise.all(
      classes.map(async (classItem) => {
        const links = await SessionLink.findByClassId(classItem.id);
        return {
          ...classItem,
          links
        };
      })
    );

    res.json({
      success: true,
      data: classesWithLinks
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

    // Fetch session links for this class
    const links = await SessionLink.findByClassId(id);

    res.json({
      success: true,
      data: {
        ...classData,
        links
      }
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
    const { name, subject, section, description, schedule } = req.body;

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
      description,
      schedule
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
    const { name, subject, section, description, schedule, status } = req.body;

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
      description,
      schedule,
      status
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

// Update class status (active/archived)
const updateClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "archived"'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const updatedClass = await Class.updateStatus(id, status);

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update class schedule
const updateClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const updatedClass = await Class.updateSchedule(id, schedule);

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Session Links Management
const getClassLinks = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const links = await SessionLink.findByClassId(id);

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Get class links error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const addClassLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = req.body;

    // Validation
    if (!link_url) {
      return res.status(400).json({
        success: false,
        error: 'Link URL is required'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const link = await SessionLink.create({
      class_id: id,
      link_url,
      link_type,
      label,
      zoom_meeting_id,
      zoom_passcode,
      is_primary
    });

    res.status(201).json({
      success: true,
      data: link
    });
  } catch (error) {
    console.error('Add class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateClassLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = req.body;

    const link = await SessionLink.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(link.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedLink = await SessionLink.update(linkId, {
      link_url,
      link_type,
      label,
      zoom_meeting_id,
      zoom_passcode,
      is_primary
    });

    res.json({
      success: true,
      data: updatedLink
    });
  } catch (error) {
    console.error('Update class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deleteClassLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await SessionLink.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(link.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await SessionLink.delete(linkId);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Delete class link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Exempted Accounts Management
const getExemptedAccounts = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const exemptions = await ExemptedAccount.findByClassId(id);

    res.json({
      success: true,
      data: exemptions
    });
  } catch (error) {
    console.error('Get exempted accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const addExemptedAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { account_identifier, reason } = req.body;

    // Validation
    if (!account_identifier) {
      return res.status(400).json({
        success: false,
        error: 'Account identifier is required'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(id);
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

    const exemption = await ExemptedAccount.create({
      class_id: id,
      account_identifier,
      reason
    });

    res.status(201).json({
      success: true,
      data: exemption
    });
  } catch (error) {
    console.error('Add exempted account error:', error);
    
    if (error.message.includes('already exempted')) {
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

const deleteExemptedAccount = async (req, res) => {
  try {
    const { exemptionId } = req.params;

    const exemption = await ExemptedAccount.findById(exemptionId);
    if (!exemption) {
      return res.status(404).json({
        success: false,
        error: 'Exemption not found'
      });
    }

    // Check ownership
    const existingClass = await Class.findById(exemption.class_id);
    if (existingClass.instructor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await ExemptedAccount.delete(exemptionId);

    res.json({
      success: true,
      message: 'Exemption removed successfully'
    });
  } catch (error) {
    console.error('Delete exempted account error:', error);
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
};
