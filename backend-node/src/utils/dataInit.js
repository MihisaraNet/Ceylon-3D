const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ roles: 'ROLE_ADMIN' });
    if (!exists) {
      const hashed = await bcrypt.hash('admin123', 12);
      await User.create({ email: 'admin@ceylon3d.com', password: hashed, fullName: 'Ceylon3D Admin', roles: ['ROLE_ADMIN'] });
      console.log('Default admin created: admin@ceylon3d.com / admin123');
    }
  } catch (err) { console.error('Admin seed error:', err.message); }
};

module.exports = { seedAdmin };
