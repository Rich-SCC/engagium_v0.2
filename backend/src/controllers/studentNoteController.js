const StudentNote = require('../models/StudentNote');
const Student = require('../models/Student');
const Class = require('../models/Class');

// Get all notes for a student
const getStudentNotes = async (req, res) => {
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

    // Verify student belongs to this class
    const student = await Student.findById(studentId);
    if (!student || student.class_id !== classId) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const notes = await StudentNote.findByStudentId(studentId);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Get student notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create a note for a student
const createNote = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { note_text } = req.body;

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

    if (!note_text || note_text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }

    const note = await StudentNote.create({
      student_id: studentId,
      note_text: note_text.trim(),
      created_by: req.user.id
    });

    // Get note with creator info
    const noteWithCreator = await StudentNote.findById(note.id);

    res.status(201).json({
      success: true,
      data: noteWithCreator
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update a note
const updateNote = async (req, res) => {
  try {
    const { classId, studentId, noteId } = req.params;
    const { note_text } = req.body;

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

    // Verify note exists and belongs to this student
    const note = await StudentNote.findById(noteId);
    if (!note || note.student_id !== studentId) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Only creator or admin can update
    if (note.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the note creator can update this note'
      });
    }

    if (!note_text || note_text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }

    await StudentNote.update(noteId, note_text.trim());
    const updatedNote = await StudentNote.findById(noteId);

    res.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete a note
const deleteNote = async (req, res) => {
  try {
    const { classId, studentId, noteId } = req.params;

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

    // Verify note exists and belongs to this student
    const note = await StudentNote.findById(noteId);
    if (!note || note.student_id !== studentId) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Only creator or admin can delete
    if (note.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the note creator can delete this note'
      });
    }

    await StudentNote.delete(noteId);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get recent notes for a class
const getRecentClassNotes = async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 10 } = req.query;

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

    const notes = await StudentNote.getRecentByClassId(classId, parseInt(limit));

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Get recent class notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getStudentNotes,
  createNote,
  updateNote,
  deleteNote,
  getRecentClassNotes
};
