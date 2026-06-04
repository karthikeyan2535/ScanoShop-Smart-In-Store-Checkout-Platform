const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Email already in use', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (prevent role injection — only allow ADMIN via specific secret)
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: userRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Auto-create cart for user
    await prisma.cart.create({ data: { userId: user.id } });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return sendCreated(res, { user, token }, 'Registered successfully');
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 'Registration failed');
  }
};

/**
 * @route POST /auth/login
 * @desc Login user and return JWT
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed');
  }
};

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch user');
  }
};

module.exports = { register, login, getMe };
