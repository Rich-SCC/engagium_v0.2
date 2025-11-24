const db = require('../config/database');

class SessionLink {
  static async create(linkData) {
    const { class_id, link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = linkData;

    // If this is set as primary, unset other primary links
    if (is_primary) {
      await db.query(
        'UPDATE session_links SET is_primary = false WHERE class_id = $1',
        [class_id]
      );
    }

    const query = `
      INSERT INTO session_links (class_id, link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      class_id, 
      link_url, 
      link_type || 'other', 
      label, 
      zoom_meeting_id, 
      zoom_passcode, 
      is_primary || false
    ]);
    return result.rows[0];
  }

  static async findByClassId(classId) {
    const query = `
      SELECT * FROM session_links
      WHERE class_id = $1
      ORDER BY is_primary DESC, created_at ASC
    `;

    const result = await db.query(query, [classId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM session_links WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, linkData) {
    const { link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = linkData;

    // If this is set as primary, unset other primary links for this class
    if (is_primary) {
      const link = await this.findById(id);
      if (link) {
        await db.query(
          'UPDATE session_links SET is_primary = false WHERE class_id = $1 AND id != $2',
          [link.class_id, id]
        );
      }
    }

    const query = `
      UPDATE session_links
      SET link_url = $1, link_type = $2, label = $3, zoom_meeting_id = $4, zoom_passcode = $5, is_primary = $6
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      link_url, 
      link_type, 
      label, 
      zoom_meeting_id, 
      zoom_passcode, 
      is_primary || false, 
      id
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM session_links WHERE id = $1';
    await db.query(query, [id]);
  }

  static async setPrimary(id) {
    const link = await this.findById(id);
    if (!link) {
      throw new Error('Link not found');
    }

    // Unset other primary links for this class
    await db.query(
      'UPDATE session_links SET is_primary = false WHERE class_id = $1',
      [link.class_id]
    );

    // Set this one as primary
    const query = `
      UPDATE session_links
      SET is_primary = true
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async getPrimaryLink(classId) {
    const query = `
      SELECT * FROM session_links
      WHERE class_id = $1 AND is_primary = true
      LIMIT 1
    `;

    const result = await db.query(query, [classId]);
    return result.rows[0];
  }
}

module.exports = SessionLink;
