/**
 * dataInit.js — Database Initialization / Seed Data
 *
 * Provides the `seedAdmin` function that runs on server startup to ensure
 * a default admin user exists in the database. If no user with the
 * 'ROLE_ADMIN' role is found, one is created automatically.
 *
 * Default admin credentials:
 *   Email:    admin@lf3d.com
 *   Password: admin123 (hashed with bcrypt, 12 salt rounds)
 *   Role:     ROLE_ADMIN
 *
 * ⚠️ These credentials should be changed in production!
 *
 * @module utils/dataInit
 * @requires bcryptjs
 * @requires ../models/User
 */

const bcrypt = require('bcryptjs');
const User   = require('../models/User');

/**
 * Seed the default admin user if no admin exists in the database.
 * Called once during server startup in server.js.
 */
const seedAdmin = async () => {
  try {
    // Check if any user with admin role already exists
    let admin = await User.findOne({ roles: 'ROLE_ADMIN' });
    if (!admin) {
      // Hash the default password and create the admin account
      const hashed = await bcrypt.hash('admin123', 12);
      await User.create({ email: 'admin@lf3d.com', password: hashed, fullName: 'ADMIN', roles: ['ROLE_ADMIN'] });
      console.log('Default admin created: admin@lf3d.com / admin123');
    } else {
      // Force update the existing admin on startup so deployed environments get the update
      let changed = false;
      if (admin.email !== 'admin@lf3d.com') { admin.email = 'admin@lf3d.com'; changed = true; }
      if (admin.fullName !== 'ADMIN') { admin.fullName = 'ADMIN'; changed = true; }
      if (changed) {
        await admin.save();
        console.log('Existing admin updated to: admin@lf3d.com');
      }
    }
  } catch (err) { console.error('Admin seed error:', err.message); }
};

module.exports = { seedAdmin };
