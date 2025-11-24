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

  static async bulkDelete(ids) {
    // Check if any students have participation logs
    const logCheck = await db.query(
      'SELECT student_id FROM participation_logs WHERE student_id = ANY($1) GROUP BY student_id',
      [ids]
    );

    if (logCheck.rows.length > 0) {
      const studentsWithLogs = logCheck.rows.map(row => row.student_id);
      throw new Error(`Cannot delete students with participation logs: ${studentsWithLogs.join(', ')}`);
    }

    const query = 'DELETE FROM students WHERE id = ANY($1)';
    const result = await db.query(query, [ids]);
    return result.rowCount;
  }

  static parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain header and at least one data row');
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const students = [];

    // Validate required columns
    const requiredColumns = ['first_name', 'last_name'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== header.length) {
        continue; // Skip malformed rows
      }

      const student = {};
      header.forEach((col, index) => {
        student[col] = values[index] || null;
      });

      students.push(student);
    }

    return students;
  }

  static async importFromCSV(classId, csvContent) {
    const parsedStudents = this.parseCSV(csvContent);
    const studentsData = parsedStudents.map(s => ({
      class_id: classId,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email || null,
      student_id: s.student_id || null
    }));

    return await this.bulkCreate(studentsData);
  }

  static async exportToCSV(classId) {
    const students = await this.findByClassId(classId);
    
    if (students.length === 0) {
      return 'first_name,last_name,email,student_id\n';
    }

    const header = 'first_name,last_name,email,student_id\n';
    const rows = students.map(s => 
      `${s.first_name},${s.last_name},${s.email || ''},${s.student_id || ''}`
    ).join('\n');

    return header + rows;
  }
}

module.exports = Student;