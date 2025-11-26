#!/usr/bin/env node
/**
 * Database Seeding Script
 * 
 * This script seeds the database with test data by:
 * 1. Generating a bcrypt hash for the test password
 * 2. Reading the seed-data.sql file
 * 3. Replacing the placeholder hash with the real hash
 * 4. Executing the SQL against the database
 * 
 * Usage: node seed-database.js
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const PASSWORD = 'Password123!';
const SALT_ROUNDS = 10;
const PLACEHOLDER_HASH = '$2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa';

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

// Run the seeding process
seedDatabase();
