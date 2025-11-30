const db = require('../config/database');

class StudentNote {
  // Create a new note for a student
  static async create(noteData) {
    const { student_id, note_text, created_by } = noteData;

    const query = `
      INSERT INTO student_notes (student_id, note_text, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [student_id, note_text, created_by]);
    return result.rows[0];
  }

  // Get all notes for a student (with creator info)
  static async findByStudentId(studentId) {
    const query = `
      SELECT sn.*, 
             u.first_name as creator_first_name,
             u.last_name as creator_last_name,
             u.email as creator_email
      FROM student_notes sn
      JOIN users u ON sn.created_by = u.id
      WHERE sn.student_id = $1
      ORDER BY sn.created_at DESC
    `;

    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  // Get single note by ID
  static async findById(noteId) {
    const query = `
      SELECT sn.*, 
             u.first_name as creator_first_name,
             u.last_name as creator_last_name,
             u.email as creator_email
      FROM student_notes sn
      JOIN users u ON sn.created_by = u.id
      WHERE sn.id = $1
    `;

    const result = await db.query(query, [noteId]);
    return result.rows[0];
  }

  // Update note (only text can be updated)
  static async update(noteId, noteText) {
    const query = `
      UPDATE student_notes
      SET note_text = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [noteText, noteId]);
    return result.rows[0];
  }

  // Delete note
  static async delete(noteId) {
    const query = 'DELETE FROM student_notes WHERE id = $1';
    await db.query(query, [noteId]);
  }

  // Get notes count for a student
  static async getNotesCount(studentId) {
    const query = `
      SELECT COUNT(*) as count
      FROM student_notes
      WHERE student_id = $1
    `;

    const result = await db.query(query, [studentId]);
    return parseInt(result.rows[0].count);
  }

  // Get recent notes for a class (across all students)
  static async getRecentByClassId(classId, limit = 10) {
    const query = `
      SELECT sn.*, 
             s.full_name as student_full_name,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM student_notes sn
      JOIN students s ON sn.student_id = s.id
      JOIN users u ON sn.created_by = u.id
      WHERE s.class_id = $1
      ORDER BY sn.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [classId, limit]);
    return result.rows;
  }

  // Search notes by text
  static async searchByText(classId, searchText) {
    const query = `
      SELECT sn.*, 
             s.full_name as student_full_name,
             u.first_name as creator_first_name,
             u.last_name as creator_last_name
      FROM student_notes sn
      JOIN students s ON sn.student_id = s.id
      JOIN users u ON sn.created_by = u.id
      WHERE s.class_id = $1 AND sn.note_text ILIKE $2
      ORDER BY sn.created_at DESC
    `;

    const result = await db.query(query, [classId, `%${searchText}%`]);
    return result.rows;
  }

  // Delete all notes for a student
  static async deleteAllForStudent(studentId) {
    const query = 'DELETE FROM student_notes WHERE student_id = $1';
    const result = await db.query(query, [studentId]);
    return result.rowCount;
  }
}

module.exports = StudentNote;
