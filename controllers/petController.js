import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// @desc    Get all pets for current user
// @route   GET /api/pets
// @access  Private
export const getPets = async (req, res, next) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: { pets }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single pet
// @route   GET /api/pets/:id
// @access  Private
export const getPet = async (req, res, next) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { pet }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new pet
// @route   POST /api/pets
// @access  Private
export const createPet = async (req, res, next) => {
  try {
    const { name, species, breed, age } = req.body;

    // Validation
    if (!name || !species) {
      throw new AppError('Please provide pet name and species', 400);
    }

    const pet = await prisma.pet.create({
      data: {
        userId: req.user.id,
        name,
        species: species.toLowerCase(),
        breed: breed || null,
        age: age ? parseInt(age) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pet added successfully',
      data: { pet }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private
export const updatePet = async (req, res, next) => {
  try {
    const { name, species, breed, age } = req.body;

    // Check if pet exists and belongs to user
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!existingPet) {
      throw new AppError('Pet not found', 404);
    }

    const pet = await prisma.pet.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: name || existingPet.name,
        species: species ? species.toLowerCase() : existingPet.species,
        breed: breed !== undefined ? breed : existingPet.breed,
        age: age !== undefined ? (age ? parseInt(age) : null) : existingPet.age
      }
    });

    res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      data: { pet }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private
export const deletePet = async (req, res, next) => {
  try {
    // Check if pet exists and belongs to user
    const pet = await prisma.pet.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    await prisma.pet.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
