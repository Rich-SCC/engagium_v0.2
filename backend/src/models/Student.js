const db = require('../config/database');

class Student {
  static async create(studentData) {
    const { class_id, first_name, last_name, email, student_id } = studentData;

    const query = `
      INSERT INTO students (class_id, first_name, last_name, email, student_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [class_id, first_name, last_name, email, student_id]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Student ID already exists in this class');
      }
      throw error;
    }
  }

  static async findByClassId(classId) {
    const query = `
      SELECT * FROM students
      WHERE class_id = $1
      ORDER BY last_name, first_name
    `;

    const result = await db.query(query, [classId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT s.*, c.name as class_name, c.subject
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, studentData) {
    const { first_name, last_name, email, student_id } = studentData;

    const query = `
      UPDATE students
      SET first_name = $1, last_name = $2, email = $3, student_id = $4
      WHERE id = $5
      RETURNING *
    `;

    try {
      const result = await db.query(query, [first_name, last_name, email, student_id, id]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Student ID already exists in this class');
      }
      throw error;
    }
  }

  static async delete(id) {
    // Check if student has participation logs
    const logCheck = await db.query(
      'SELECT COUNT(*) as count FROM participation_logs WHERE student_id = $1',
      [id]
    );

    if (parseInt(logCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete student with participation logs');
    }

    const query = 'DELETE FROM students WHERE id = $1';
    await db.query(query, [id]);
  }

  static async bulkCreate(studentsData) {
    const results = [];

    for (const studentData of studentsData) {
      try {
        const student = await this.create(studentData);
        results.push({ success: true, data: student });
      } catch (error) {
        results.push({ success: false, error: error.message, data: studentData });
      }
    }

    return results;
  }

  static async findByClassIdAndStudentId(classId, studentId) {
    const query = `
      SELECT * FROM students
      WHERE class_id = $1 AND student_id = $2
    `;

    const result = await db.query(query, [classId, studentId]);
    return result.rows[0];
  }
}

module.exports = Student;