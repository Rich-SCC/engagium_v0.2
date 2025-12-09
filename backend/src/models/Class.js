const db = require('../config/database');

class Class {
  static async create(classData) {
    const { instructor_id, name, subject, section, description, schedule } = classData;

    const query = `
      INSERT INTO classes (instructor_id, name, subject, section, description, schedule, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;

    const scheduleJson = schedule ? JSON.stringify(schedule) : null;
    const result = await db.query(query, [instructor_id, name, subject, section, description, scheduleJson]);
    return result.rows[0];
  }

  static async findByInstructorId(instructorId, includeArchived = false) {
    // When includeArchived is true, show ONLY archived classes
    // When includeArchived is false, show ONLY active classes
    const statusFilter = includeArchived ? "AND c.status = 'archived'" : "AND c.status = 'active'";
    
    const query = `
      SELECT c.*,
             COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.deleted_at IS NULL
      WHERE c.instructor_id = $1 ${statusFilter}
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
    const { name, subject, section, description, schedule, status } = classData;

    const query = `
      UPDATE classes
      SET name = $1, subject = $2, section = $3, description = $4, schedule = $5, status = $6
      WHERE id = $7
      RETURNING *
    `;

    const scheduleJson = schedule ? JSON.stringify(schedule) : null;
    const result = await db.query(query, [name, subject, section, description, scheduleJson, status || 'active', id]);
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
    const query = 'SELECT COUNT(*) as count FROM students WHERE class_id = $1 AND deleted_at IS NULL';
    const result = await db.query(query, [classId]);
    return parseInt(result.rows[0].count);
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE classes
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, id]);
    return result.rows[0];
  }

  static async updateSchedule(id, schedule) {
    const query = `
      UPDATE classes
      SET schedule = $1
      WHERE id = $2
      RETURNING *
    `;

    const scheduleJson = JSON.stringify(schedule);
    const result = await db.query(query, [scheduleJson, id]);
    return result.rows[0];
  }
}

module.exports = Class;