import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// Generate JWT Token for Admin
const generateToken = (id, email, role = 'admin') => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token with admin role
    const token = generateToken(admin.id, admin.email, 'admin');

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminWithoutPassword,
        token,
        role: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
export const getAdminMe = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { admin, role: 'admin' }
    });
  } catch (error) {
    next(error);
  }
};
