const db = require('../config/database');

class StudentTag {
  // Create a new tag for a class
  static async create(tagData) {
    const { class_id, tag_name, tag_color = '#3B82F6' } = tagData;

    const query = `
      INSERT INTO student_tags (class_id, tag_name, tag_color)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [class_id, tag_name, tag_color]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Tag name already exists in this class');
      }
      throw error;
    }
  }

  // Get all tags for a class
  static async findByClassId(classId) {
    const query = `
      SELECT st.*, 
             COUNT(sta.student_id) as student_count
      FROM student_tags st
      LEFT JOIN student_tag_assignments sta ON st.id = sta.tag_id
      WHERE st.class_id = $1
      GROUP BY st.id
      ORDER BY st.tag_name
    `;

    const result = await db.query(query, [classId]);
    return result.rows;
  }

  // Get single tag by ID
  static async findById(tagId) {
    const query = `
      SELECT st.*, 
             COUNT(sta.student_id) as student_count
      FROM student_tags st
      LEFT JOIN student_tag_assignments sta ON st.id = sta.tag_id
      WHERE st.id = $1
      GROUP BY st.id
    `;

    const result = await db.query(query, [tagId]);
    return result.rows[0];
  }

  // Update tag
  static async update(tagId, tagData) {
    const { tag_name, tag_color } = tagData;

    const query = `
      UPDATE student_tags
      SET tag_name = $1, tag_color = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [tag_name, tag_color, tagId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Tag name already exists in this class');
      }
      throw error;
    }
  }

  // Delete tag (also deletes all assignments via CASCADE)
  static async delete(tagId) {
    const query = 'DELETE FROM student_tags WHERE id = $1';
    await db.query(query, [tagId]);
  }

  // Assign tag to student
  static async assignToStudent(studentId, tagId) {
    const query = `
      INSERT INTO student_tag_assignments (student_id, tag_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [studentId, tagId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Student already has this tag');
      }
      throw error;
    }
  }

  // Remove tag from student
  static async removeFromStudent(studentId, tagId) {
    const query = `
      DELETE FROM student_tag_assignments
      WHERE student_id = $1 AND tag_id = $2
    `;
    await db.query(query, [studentId, tagId]);
  }

  // Get all tags for a student
  static async getStudentTags(studentId) {
    const query = `
      SELECT st.*
      FROM student_tags st
      JOIN student_tag_assignments sta ON st.id = sta.tag_id
      WHERE sta.student_id = $1
      ORDER BY st.tag_name
    `;

    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  // Get all students with a specific tag
  static async getStudentsByTag(tagId) {
    const query = `
      SELECT s.*
      FROM students s
      JOIN student_tag_assignments sta ON s.id = sta.student_id
      WHERE sta.tag_id = $1
      ORDER BY s.full_name
    `;

    const result = await db.query(query, [tagId]);
    return result.rows;
  }

  // Bulk assign tags to multiple students
  static async bulkAssign(studentIds, tagId) {
    const values = studentIds.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const params = studentIds.flatMap(sid => [sid, tagId]);

    const query = `
      INSERT INTO student_tag_assignments (student_id, tag_id)
      VALUES ${values}
      ON CONFLICT (student_id, tag_id) DO NOTHING
      RETURNING *
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  // Bulk remove tag from multiple students
  static async bulkRemove(studentIds, tagId) {
    const query = `
      DELETE FROM student_tag_assignments
      WHERE student_id = ANY($1) AND tag_id = $2
    `;

    const result = await db.query(query, [studentIds, tagId]);
    return result.rowCount;
  }

  // Remove all tags from a student
  static async removeAllFromStudent(studentId) {
    const query = `
      DELETE FROM student_tag_assignments
      WHERE student_id = $1
    `;
    await db.query(query, [studentId]);
  }
}

module.exports = StudentTag;
