const bcrypt = require('bcrypt');
const pool = require('../db');

async function seedAdmin() {
  const adminEmail = 'admin@minicomplihr.com';
  const adminPassword = 'admin123';
  const saltRounds = 10;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Check if admin exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      // Update existing admin password
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, adminEmail]
      );
      console.log('✓ Admin password updated successfully');
    } else {
      // Insert new admin
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ('System Admin', $1, $2, 'admin')`,
        [adminEmail, hashedPassword]
      );
      console.log('✓ Admin user created successfully');
    }

    console.log('\nAdmin credentials:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nYou can now login and use the API.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
