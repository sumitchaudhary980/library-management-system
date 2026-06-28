const bcrypt = require('bcrypt');
const db = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = db
      .prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
      .get(email, email);

    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Store full session — works for both admin and user
    req.session.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    // Tell frontend where to redirect based on role
    const redirectMap = {
      admin: '/dashboard',
      reader: '/user/dashboard',
    };

    return res.json({
      message: 'Login successful',
      role: user.role,
      redirect: redirectMap[user.role] ?? '/user/dashboard',
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
};

const getSession = (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user: req.session.user });
};

module.exports = { login, logout, getSession };