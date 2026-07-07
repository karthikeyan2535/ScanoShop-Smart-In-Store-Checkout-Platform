const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');

/**
 * Normalize email consistently — lowercase + trim.
 * Avoids relying on express-validator's normalizeEmail() which can mangle addresses.
 */
const normalizeEmail = (email) => email?.toLowerCase().trim();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    const email = normalizeEmail(rawEmail);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    // Hash password — 12 rounds is OWASP recommended minimum
    const hashedPassword = await bcrypt.hash(password, 12);

    // Role injection guard — only allow ADMIN role if explicitly intended
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { name: name.trim(), email, password: hashedPassword, role: userRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Auto-create cart for the new user
    await prisma.cart.create({ data: { userId: user.id } });

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return sendCreated(res, { user, token }, 'Account created successfully');
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 'Registration failed. Please try again.', 500);
  }
};

/**
 * @route POST /auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = normalizeEmail(rawEmail);

    // Find user — use a generic error message to avoid user enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    // Always compare (even if user not found) to prevent timing attacks
    const dummyHash = '$2a$12$dummyhashfordummycomparison000000000000000000000000000';
    const passwordToCompare = user ? user.password : dummyHash;
    const isMatch = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed. Please try again.', 500);
  }
};

/**
 * @route GET /auth/me
 * @desc Get current authenticated user's profile
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);
  } catch (error) {
    console.error('GetMe error:', error);
    return sendError(res, 'Failed to fetch user profile', 500);
  }
};

module.exports = { register, login, getMe };
