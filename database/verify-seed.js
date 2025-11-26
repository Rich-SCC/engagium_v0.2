#!/usr/bin/env node
/**
 * Verify Database Seed Data
 * 
 * This script checks that the seed data was properly inserted
 * and displays a summary of what's in the database.
 * 
 * Usage: node verify-seed.js
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function verifySeed() {
  console.log('🔍 Verifying database seed data...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check users
    const usersResult = await client.query('SELECT COUNT(*) as count, role FROM users GROUP BY role');
    console.log('👥 USERS:');
    usersResult.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count}`);
    });

    // Check classes
    const classesResult = await client.query('SELECT COUNT(*) as count, status FROM classes GROUP BY status');
    console.log('\n📚 CLASSES:');
    classesResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // Check students
    const studentsResult = await client.query(`
      SELECT c.name, COUNT(s.id) as student_count 
      FROM classes c 
      LEFT JOIN students s ON c.id = s.class_id 
      GROUP BY c.id, c.name 
      ORDER BY c.name
    `);
    console.log('\n🎓 STUDENTS BY CLASS:');
    studentsResult.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.student_count} students`);
    });

    // Check sessions
    const sessionsResult = await client.query('SELECT COUNT(*) as count, status FROM sessions GROUP BY status');
    const totalSessions = await client.query('SELECT COUNT(*) as count FROM sessions');
    console.log('\n📅 SESSIONS:');
    console.log(`   Total: ${totalSessions.rows[0].count}`);
    sessionsResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // Check participation logs
    const participationResult = await client.query(`
      SELECT interaction_type, COUNT(*) as count 
      FROM participation_logs 
      GROUP BY interaction_type 
      ORDER BY count DESC
    `);
    const totalParticipation = await client.query('SELECT COUNT(*) as count FROM participation_logs');
    console.log('\n💬 PARTICIPATION LOGS:');
    console.log(`   Total: ${totalParticipation.rows[0].count}`);
    participationResult.rows.forEach(row => {
      console.log(`   ${row.interaction_type}: ${row.count}`);
    });

    // Check tags
    const tagsResult = await client.query('SELECT COUNT(*) as count FROM student_tags');
    const tagAssignmentsResult = await client.query('SELECT COUNT(*) as count FROM student_tag_assignments');
    console.log('\n🏷️  TAGS:');
    console.log(`   Tag definitions: ${tagsResult.rows[0].count}`);
    console.log(`   Tag assignments: ${tagAssignmentsResult.rows[0].count}`);

    // Check notes
    const notesResult = await client.query('SELECT COUNT(*) as count FROM student_notes');
    console.log('\n📝 STUDENT NOTES:', notesResult.rows[0].count);

    // Check notifications
    const notificationsResult = await client.query('SELECT COUNT(*) as count, read FROM notifications GROUP BY read');
    console.log('\n🔔 NOTIFICATIONS:');
    notificationsResult.rows.forEach(row => {
      console.log(`   ${row.read ? 'Read' : 'Unread'}: ${row.count}`);
    });

    // Check session links
    const linksResult = await client.query('SELECT COUNT(*) as count FROM session_links');
    console.log('\n🔗 SESSION LINKS:', linksResult.rows[0].count);

    // Check exempted accounts
    const exemptedResult = await client.query('SELECT COUNT(*) as count FROM exempted_accounts');
    console.log('\n🚫 EXEMPTED ACCOUNTS:', exemptedResult.rows[0].count);

    // Test login credentials
    console.log('\n═══════════════════════════════════════════');
    console.log('🔐 TEST LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    
    const instructors = await client.query(`
      SELECT email, first_name, last_name, 
             (SELECT COUNT(*) FROM classes WHERE instructor_id = users.id) as class_count
      FROM users 
      WHERE role = 'instructor'
      ORDER BY first_name
    `);
    
    instructors.rows.forEach(instructor => {
      console.log(`\n   📧 Email: ${instructor.email}`);
      console.log(`   👤 Name: ${instructor.first_name} ${instructor.last_name}`);
      console.log(`   📚 Classes: ${instructor.class_count}`);
      console.log(`   🔑 Password: Password123!`);
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('\n✅ Verification complete! Database is ready for testing.\n');

    await client.end();
  } catch (error) {
    console.error('❌ Error verifying seed data:', error);
    process.exit(1);
  }
}

// Run verification
verifySeed();
