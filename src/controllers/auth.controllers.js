import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const isEmpty = (value) => !value || value.trim() === '';

// ==================== CUSTOMER REGISTRATION ====================
export const registerCustomer = async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (isEmpty(username) || isEmpty(email) || isEmpty(password)) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'Customer',
    });

    res
      .status(201)
      .json({ message: `Customer ${user.username} registered successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ==================== SELLER REGISTRATION (ADMIN ONLY) ====================
export const registerSeller = async (req, res) => {
  const { businessName, email, password, gstin } = req.body;

  if (
    isEmpty(businessName) ||
    isEmpty(email) ||
    isEmpty(password) ||
    isEmpty(gstin)
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  // GSTIN validation
  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/i;
  if (!gstRegex.test(gstin)) {
    return res.status(400).json({ message: 'Invalid GSTIN format' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      businessName,
      email,
      password: hashedPassword,
      gstin,
      role: 'Seller',
    });

    res
      .status(201)
      .json({ message: `Seller ${businessName} registered successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ==================== ADMIN REGISTRATION (ADMIN ONLY) ====================
export const registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  if (isEmpty(username) || isEmpty(email) || isEmpty(password)) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'Admin',
    });

    res
      .status(201)
      .json({ message: `Admin ${user.username} registered successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (isEmpty(email) || isEmpty(password)) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    // Refresh token (optional)
    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    // Cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'lax' works in dev for cross-origin
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ==================== GET CURRENT USER ====================
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    res.status(200).json({
      user: {
        id: req.user._id,
        username: req.user.username || req.user.businessName,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ==================== LOGOUT ====================
export const logout = async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('jwt');
  res.status(200).json({ message: 'Logged out successfully' });
};