import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// @desc    Get all veterinarians
// @route   GET /api/admin/veterinarians
// @access  Private (Admin)
export const getAllVeterinarians = async (req, res, next) => {
  try {
    const veterinarians = await prisma.veterinarian.findMany({
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      count: veterinarians.length,
      data: { veterinarians }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create veterinarian
// @route   POST /api/admin/veterinarians
// @access  Private (Admin)
export const createVeterinarian = async (req, res, next) => {
  try {
    const { name, specialization, available } = req.body;

    if (!name) {
      throw new AppError('Please provide veterinarian name', 400);
    }

    const veterinarian = await prisma.veterinarian.create({
      data: {
        name,
        specialization: specialization || null,
        available: available !== undefined ? available : true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Veterinarian created successfully',
      data: { veterinarian }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update veterinarian
// @route   PUT /api/admin/veterinarians/:id
// @access  Private (Admin)
export const updateVeterinarian = async (req, res, next) => {
  try {
    const { name, specialization, available } = req.body;
    const vetId = parseInt(req.params.id);

    // Check if vet exists
    const existingVet = await prisma.veterinarian.findUnique({
      where: { id: vetId }
    });

    if (!existingVet) {
      throw new AppError('Veterinarian not found', 404);
    }

    const veterinarian = await prisma.veterinarian.update({
      where: { id: vetId },
      data: {
        name: name || existingVet.name,
        specialization: specialization !== undefined ? specialization : existingVet.specialization,
        available: available !== undefined ? available : existingVet.available
      }
    });

    res.status(200).json({
      success: true,
      message: 'Veterinarian updated successfully',
      data: { veterinarian }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle veterinarian availability
// @route   PATCH /api/admin/veterinarians/:id/availability
// @access  Private (Admin)
export const toggleVeterinarianAvailability = async (req, res, next) => {
  try {
    const vetId = parseInt(req.params.id);

    // Get current status
    const vet = await prisma.veterinarian.findUnique({
      where: { id: vetId }
    });

    if (!vet) {
      throw new AppError('Veterinarian not found', 404);
    }

    // Toggle availability
    const veterinarian = await prisma.veterinarian.update({
      where: { id: vetId },
      data: { available: !vet.available }
    });

    res.status(200).json({
      success: true,
      message: `Veterinarian ${veterinarian.available ? 'set as available' : 'set as unavailable'}`,
      data: { veterinarian }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete veterinarian
// @route   DELETE /api/admin/veterinarians/:id
// @access  Private (Admin)
export const deleteVeterinarian = async (req, res, next) => {
  try {
    const vetId = parseInt(req.params.id);

    // Check if vet has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { vetId }
    });

    if (appointmentCount > 0) {
      throw new AppError(
        'Cannot delete veterinarian with existing appointments. Set as unavailable instead.',
        400
      );
    }

    await prisma.veterinarian.delete({
      where: { id: vetId }
    });

    res.status(200).json({
      success: true,
      message: 'Veterinarian deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
