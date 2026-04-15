const db = require('../config/database');
const { normalizeMeetingLink } = require('../utils/urlUtils');

class SessionLink {
  static async create(linkData) {
    const { class_id, link_url, link_type, label, zoom_meeting_id, zoom_passcode, is_primary } = linkData;
    const normalizedLink = normalizeMeetingLink(link_url);

    if (!normalizedLink) {
      throw new Error('Link URL is required');
    }

    const existingQuery = `
      SELECT * FROM session_links
      WHERE class_id = $1 AND LOWER(link_url) = LOWER($2)
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const existingResult = await db.query(existingQuery, [class_id, normalizedLink]);
    const existingLink = existingResult.rows[0];

    if (existingLink) {
      if (is_primary && !existingLink.is_primary) {
        const updatedPrimary = await this.update(existingLink.id, {
          link_url: existingLink.link_url,
          link_type: existingLink.link_type,
          label: existingLink.label,
          zoom_meeting_id: existingLink.zoom_meeting_id,
          zoom_passcode: existingLink.zoom_passcode,
          is_primary: true
        });
        return updatedPrimary;
      }

      return existingLink;
    }

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

    try {
      const result = await db.query(query, [
        class_id,
        normalizedLink,
        link_type || 'other',
        label,
        zoom_meeting_id,
        zoom_passcode,
        is_primary || false
      ]);
      return result.rows[0];
    } catch (error) {
      // Gracefully handle race-condition duplicates when unique index is enabled.
      if (error?.code === '23505') {
        const duplicateResult = await db.query(existingQuery, [class_id, normalizedLink]);
        if (duplicateResult.rows[0]) {
          return duplicateResult.rows[0];
        }
      }
      throw error;
    }
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
    const link = await this.findById(id);

    if (!link) {
      return null;
    }

    const normalizedLink = normalizeMeetingLink(link_url);

    if (!normalizedLink) {
      throw new Error('Link URL is required');
    }

    const duplicateQuery = `
      SELECT id FROM session_links
      WHERE class_id = $1 AND id != $2 AND LOWER(link_url) = LOWER($3)
      LIMIT 1
    `;
    const duplicateResult = await db.query(duplicateQuery, [link.class_id, id, normalizedLink]);
    if (duplicateResult.rows.length > 0) {
      const duplicateError = new Error('This link is already saved for this class');
      duplicateError.code = 'DUPLICATE_CLASS_LINK';
      throw duplicateError;
    }

    // If this is set as primary, unset other primary links for this class
    if (is_primary) {
      await db.query(
        'UPDATE session_links SET is_primary = false WHERE class_id = $1 AND id != $2',
        [link.class_id, id]
      );
    }

    const query = `
      UPDATE session_links
      SET link_url = $1, link_type = $2, label = $3, zoom_meeting_id = $4, zoom_passcode = $5, is_primary = $6
      WHERE id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      normalizedLink,
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
