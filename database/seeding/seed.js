#!/usr/bin/env node
/**
 * Unified Database Seeding Script
 * 
 * This script handles all database seeding operations:
 * - seed: Seeds the database with test data
 * - verify: Verifies the seed data was properly inserted
 * - hash: Generates a bcrypt hash for a password
 * 
 * Usage: 
 *   node seed.js              # Seeds the database
 *   node seed.js --verify     # Verifies seed data
 *   node seed.js --hash       # Generates a password hash
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const PASSWORD = 'Password123!';
const SALT_ROUNDS = 10;
const PLACEHOLDER_HASH = '$2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa';

// ============================================
// SEED DATABASE
// ============================================
async function seedDatabase() {
  console.log('🌱 Starting database seeding process...\n');

  try {
    // Step 1: Generate password hash
    console.log('1️⃣  Generating bcrypt hash for test password...');
    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    console.log('✅ Hash generated:', passwordHash.substring(0, 20) + '...\n');

    // Step 2: Read SQL file
    console.log('2️⃣  Reading seed-data.sql file...');
    const sqlFilePath = path.join(__dirname, 'seed-data.sql');
    let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded\n');

    // Step 3: Replace placeholder with real hash
    console.log('3️⃣  Replacing placeholder hash with real hash...');
    sqlContent = sqlContent.replace(new RegExp(PLACEHOLDER_HASH.replace(/\$/g, '\\$'), 'g'), passwordHash);
    console.log('✅ Hashes replaced\n');

    // Step 4: Connect to database
    console.log('4️⃣  Connecting to database...');
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 5: Execute SQL
    console.log('5️⃣  Executing seed data SQL...');
    await client.query(sqlContent);
    console.log('✅ Seed data inserted successfully!\n');

    // Close connection
    await client.end();

    // Display summary
    console.log('═══════════════════════════════════════════');
    console.log('✨ Database seeded successfully! ✨');
    console.log('═══════════════════════════════════════════\n');
    console.log('📊 Data Summary:');
    console.log('   • 3 Instructor accounts');
    console.log('   • 5 Classes (4 active, 1 archived)');
    console.log('   • 45 Students');
    console.log('   • 13 Sessions with participation data');
    console.log('   • Multiple tags, notes, and notifications\n');
    console.log('🔐 Test Login Credentials:');
    console.log('   Email: john.doe@university.edu');
    console.log('   Password: Password123!\n');
    console.log('   Email: sarah.smith@university.edu');
    console.log('   Password: Password123!\n');
    console.log('   Email: michael.johnson@university.edu');
    console.log('   Password: Password123!\n');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// ============================================
// VERIFY SEED DATA
// ============================================
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

// ============================================
// GENERATE PASSWORD HASH
// ============================================
async function generateHash() {
  console.log('\n🔐 Generating bcrypt hash...\n');
  
  try {
    const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    console.log('✅ Password hash generated!\n');
    console.log('Password:', PASSWORD);
    console.log('Hash:', hash);
    console.log('\nCopy this hash and replace the placeholder in database/seed-data.sql\n');
    console.log('Look for:', PLACEHOLDER_HASH);
    console.log('Replace with:', hash);
    console.log('');
  } catch (error) {
    console.error('❌ Error generating hash:', error);
    process.exit(1);
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    await verifySeed();
  } else if (args.includes('--hash')) {
    await generateHash();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Engagium Database Seeding Tool

Usage:
  node seed.js              Seed the database with test data
  node seed.js --verify     Verify seed data was properly inserted
  node seed.js --hash       Generate a bcrypt hash for the test password
  node seed.js --help       Show this help message

Environment:
  Requires DATABASE_URL in backend/.env

Test Credentials:
  Email: john.doe@university.edu
  Password: Password123!
`);
  } else {
    await seedDatabase();
  }
}

main();
