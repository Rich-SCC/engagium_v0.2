const db = require('../config/database');

class Class {
  static async create(classData) {
    const { instructor_id, name, subject, section, description } = classData;

    const query = `
      INSERT INTO classes (instructor_id, name, subject, section, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [instructor_id, name, subject, section, description]);
    return result.rows[0];
  }

  static async findByInstructorId(instructorId) {
    const query = `
      SELECT c.*,
             COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.instructor_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const result = await db.query(query, [instructorId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT c.*, u.first_name as instructor_first_name, u.last_name as instructor_last_name
      FROM classes c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, classData) {
    const { name, subject, section, description } = classData;

    const query = `
      UPDATE classes
      SET name = $1, subject = $2, section = $3, description = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await db.query(query, [name, subject, section, description, id]);
    return result.rows[0];
  }

  static async delete(id) {
    // Check if class has sessions
    const sessionCheck = await db.query(
      'SELECT COUNT(*) as count FROM sessions WHERE class_id = $1',
      [id]
    );

    if (parseInt(sessionCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete class with existing sessions');
    }

    const query = 'DELETE FROM classes WHERE id = $1';
    await db.query(query, [id]);
  }

  static async getStudentCount(classId) {
    const query = 'SELECT COUNT(*) as count FROM students WHERE class_id = $1';
    const result = await db.query(query, [classId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Class;