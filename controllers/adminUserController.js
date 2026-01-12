import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';
import { sendPasswordResetByAdmin } from '../utils/emailService.js';

const prisma = new PrismaClient();

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // 16 character password
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            pets: true,
            appointments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserDetails = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        pets: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            age: true
          }
        },
        appointments: {
          include: {
            pet: true,
            vet: true
          },
          orderBy: { appointmentDate: 'desc' }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user information
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        throw new AppError('Email is already in use', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        phone: phone || existingUser.phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private (Admin)
export const resetUserPassword = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate random temporary password
    const tempPassword = generateRandomPassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Send email with temporary password
    try {
      await sendPasswordResetByAdmin(user.email, user.name, tempPassword);

      res.status(200).json({
        success: true,
        message: `Password reset email sent to ${user.email}`
      });
    } catch (emailError) {
      // If email fails, revert password change
      throw new AppError('Failed to send reset email. Please try again.', 500);
    }
  } catch (error) {
    next(error);
  }
};
