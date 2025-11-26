#!/usr/bin/env node
/**
 * Generate Password Hash for Seed Data
 * 
 * This script generates a bcrypt hash for the password "Password123!"
 * to be used in the seed-data.sql file.
 * 
 * Usage: node generate-hash.js
 */

const bcrypt = require('bcrypt');

const password = 'Password123!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('\n✅ Password hash generated!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nCopy this hash and replace the placeholder in database/seed-data.sql\n');
    console.log('Look for: $2b$10$rKvFJZ2fWf7ufVd1PHX3uOXGHvJYGZGvxvJqjBqX8Z0oj4Q4Y4xZa');
    console.log('Replace with:', hash);
    console.log('');
  })
  .catch(err => {
    console.error('Error generating hash:', err);
    process.exit(1);
  });
