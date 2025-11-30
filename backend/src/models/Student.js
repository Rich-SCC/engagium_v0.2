const db = require('../config/database');

class Student {
  static async create(studentData) {
    const { class_id, full_name, student_id } = studentData;

    const query = `
      INSERT INTO students (class_id, full_name, student_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [class_id, full_name, student_id]);
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
      ORDER BY full_name
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
    const { full_name, student_id } = studentData;

    const query = `
      UPDATE students
      SET full_name = $1, student_id = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [full_name, student_id, id]);
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

  static async findByClassIdAndName(classId, fullName) {
    const query = `
      SELECT * FROM students
      WHERE class_id = $1 AND LOWER(full_name) = LOWER($2)
    `;

    const result = await db.query(query, [classId, fullName]);
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

    // Validate required columns - either full_name or first_name+last_name
    const hasFullName = header.includes('full_name') || header.includes('fullname') || header.includes('name');
    const hasFirstLast = header.includes('first_name') && header.includes('last_name');
    
    if (!hasFullName && !hasFirstLast) {
      throw new Error('CSV must contain either full_name/name column or first_name and last_name columns');
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

      // Build full_name from available columns
      let fullName;
      if (student.full_name || student.fullname || student.name) {
        fullName = student.full_name || student.fullname || student.name;
      } else if (student.first_name && student.last_name) {
        fullName = `${student.first_name} ${student.last_name}`.trim();
      }

      if (fullName) {
        students.push({
          full_name: fullName,
          student_id: student.student_id || student.id || null
        });
      }
    }

    return students;
  }

  static async importFromCSV(classId, csvContent) {
    const parsedStudents = this.parseCSV(csvContent);
    const studentsData = parsedStudents.map(s => ({
      class_id: classId,
      full_name: s.full_name,
      student_id: s.student_id || null
    }));

    return await this.bulkCreate(studentsData);
  }

  static async exportToCSV(classId) {
    const students = await this.findByClassId(classId);
    
    if (students.length === 0) {
      return 'full_name,student_id\n';
    }

    const header = 'full_name,student_id\n';
    const rows = students.map(s => 
      `${s.full_name},${s.student_id || ''}`
    ).join('\n');

    return header + rows;
  }

  // Search and filter students with advanced options
  static async searchAndFilter(classId, options = {}) {
    const {
      search = '',
      sortBy = 'full_name',
      sortOrder = 'ASC',
      tagIds = [],
      hasNotes = null,
      limit = null,
      offset = 0
    } = options;

    let query = `
      SELECT DISTINCT s.*,
             COUNT(DISTINCT pl.id) as participation_count,
             COUNT(DISTINCT sn.id) as notes_count,
             ARRAY_AGG(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL) as tag_ids,
             ARRAY_AGG(DISTINCT st.tag_name) FILTER (WHERE st.tag_name IS NOT NULL) as tag_names
      FROM students s
      LEFT JOIN participation_logs pl ON s.id = pl.student_id
      LEFT JOIN student_notes sn ON s.id = sn.student_id
      LEFT JOIN student_tag_assignments sta ON s.id = sta.student_id
      LEFT JOIN student_tags st ON sta.tag_id = st.id
      WHERE s.class_id = $1
    `;

    const params = [classId];
    let paramCount = 1;

    // Search filter
    if (search) {
      paramCount++;
      query += ` AND (
        s.full_name ILIKE $${paramCount} OR 
        s.student_id ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY s.id`;

    // Tag filter
    if (tagIds.length > 0) {
      paramCount++;
      query += ` HAVING ARRAY_AGG(DISTINCT st.id) && $${paramCount}`;
      params.push(tagIds);
    }

    // Has notes filter
    if (hasNotes !== null) {
      if (hasNotes) {
        query += ` ${tagIds.length > 0 ? 'AND' : 'HAVING'} COUNT(DISTINCT sn.id) > 0`;
      } else {
        query += ` ${tagIds.length > 0 ? 'AND' : 'HAVING'} COUNT(DISTINCT sn.id) = 0`;
      }
    }

    // Sorting
    const validSortColumns = ['full_name', 'student_id', 'participation_count', 'notes_count'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      if (sortBy === 'participation_count' || sortBy === 'notes_count') {
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
      } else {
        query += ` ORDER BY s.${sortBy} ${sortOrder}`;
      }
    } else {
      query += ` ORDER BY s.full_name ASC`;
    }

    // Pagination
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    if (offset > 0) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  // Get student with full details (tags, notes count, participation count)
  static async findByIdWithDetails(id) {
    const query = `
      SELECT s.*, 
             c.name as class_name, 
             c.subject,
             COUNT(DISTINCT pl.id) as participation_count,
             COUNT(DISTINCT sn.id) as notes_count,
             ARRAY_AGG(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL) as tag_ids,
             ARRAY_AGG(DISTINCT st.tag_name) FILTER (WHERE st.tag_name IS NOT NULL) as tag_names
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN participation_logs pl ON s.id = pl.student_id
      LEFT JOIN student_notes sn ON s.id = sn.student_id
      LEFT JOIN student_tag_assignments sta ON s.id = sta.student_id
      LEFT JOIN student_tags st ON sta.tag_id = st.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get participation count for student
  static async getParticipationCount(studentId) {
    const query = `
      SELECT COUNT(*) as count
      FROM participation_logs
      WHERE student_id = $1
    `;

    const result = await db.query(query, [studentId]);
    return parseInt(result.rows[0].count);
  }

  // Check for duplicate students (by student_id or full_name)
  static async findDuplicates(classId, fullName, studentId) {
    const query = `
      SELECT * FROM students
      WHERE class_id = $1 AND (
        (full_name IS NOT NULL AND LOWER(full_name) = LOWER($2)) OR
        (student_id IS NOT NULL AND student_id = $3)
      )
    `;

    const result = await db.query(query, [classId, fullName, studentId]);
    return result.rows;
  }

  // Merge two students (combine participation logs, notes, tags)
  static async merge(keepStudentId, mergeStudentId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Transfer participation logs
      await client.query(
        'UPDATE participation_logs SET student_id = $1 WHERE student_id = $2',
        [keepStudentId, mergeStudentId]
      );

      // Transfer notes
      await client.query(
        'UPDATE student_notes SET student_id = $1 WHERE student_id = $2',
        [keepStudentId, mergeStudentId]
      );

      // Transfer tags (avoiding duplicates)
      await client.query(
        `INSERT INTO student_tag_assignments (student_id, tag_id)
         SELECT $1, tag_id FROM student_tag_assignments WHERE student_id = $2
         ON CONFLICT (student_id, tag_id) DO NOTHING`,
        [keepStudentId, mergeStudentId]
      );

      // Delete the merged student
      await client.query('DELETE FROM students WHERE id = $1', [mergeStudentId]);

      await client.query('COMMIT');

      return await this.findByIdWithDetails(keepStudentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk update students (for bulk edit operations)
  static async bulkUpdate(updates) {
    const results = [];

    for (const update of updates) {
      try {
        const { id, ...data } = update;
        const student = await this.update(id, data);
        results.push({ success: true, data: student });
      } catch (error) {
        results.push({ success: false, error: error.message, id: update.id });
      }
    }

    return results;
  }

  // Create student from participant name (for adding unmatched participants to roster)
  static async createFromParticipant(classId, participantName) {
    // Check if student with this name already exists
    const existing = await this.findByClassIdAndName(classId, participantName);
    if (existing) {
      return { created: false, student: existing };
    }

    const student = await this.create({
      class_id: classId,
      full_name: participantName,
      student_id: null
    });

    return { created: true, student };
  }
}

module.exports = Student;