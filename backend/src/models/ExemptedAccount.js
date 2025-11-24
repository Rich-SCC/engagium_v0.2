const db = require('../config/database');

class ExemptedAccount {
  static async create(exemptionData) {
    const { class_id, account_identifier, reason } = exemptionData;

    const query = `
      INSERT INTO exempted_accounts (class_id, account_identifier, reason)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [class_id, account_identifier, reason]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('This account is already exempted for this class');
      }
      throw error;
    }
  }

  static async findByClassId(classId) {
    const query = `
      SELECT * FROM exempted_accounts
      WHERE class_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [classId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM exempted_accounts WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, exemptionData) {
    const { account_identifier, reason } = exemptionData;

    const query = `
      UPDATE exempted_accounts
      SET account_identifier = $1, reason = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [account_identifier, reason, id]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('This account is already exempted for this class');
      }
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM exempted_accounts WHERE id = $1';
    await db.query(query, [id]);
  }

  static async isExempted(classId, accountIdentifier) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM exempted_accounts
        WHERE class_id = $1 AND LOWER(account_identifier) = LOWER($2)
      ) as is_exempted
    `;

    const result = await db.query(query, [classId, accountIdentifier]);
    return result.rows[0].is_exempted;
  }

  static async bulkCreate(classId, exemptionsData) {
    const results = [];

    for (const exemption of exemptionsData) {
      try {
        const created = await this.create({
          class_id: classId,
          account_identifier: exemption.account_identifier,
          reason: exemption.reason
        });
        results.push({ success: true, data: created });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          data: exemption 
        });
      }
    }

    return results;
  }

  static async bulkDelete(ids) {
    const query = 'DELETE FROM exempted_accounts WHERE id = ANY($1)';
    await db.query(query, [ids]);
  }
}

module.exports = ExemptedAccount;
