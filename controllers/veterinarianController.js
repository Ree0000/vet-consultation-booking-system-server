import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @desc    Get all available veterinarians
// @route   GET /api/veterinarians
// @access  Private
export const getVeterinarians = async (req, res, next) => {
  try {
    const veterinarians = await prisma.veterinarian.findMany({
      where: { available: true },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: { veterinarians }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available veterinarians for a time slot
// @route   GET /api/veterinarians/available
// @access  Private
export const getAvailableVet = async (req, res, next) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and time'
      });
    }

    // Get all available vets
    const vets = await prisma.veterinarian.findMany({
      where: { available: true }
    });

    if (vets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No veterinarians available'
      });
    }

    // Find vets not booked for this time slot
    const appointmentDate = new Date(date);

    const bookedVets = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
          lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
        },
        appointmentTime: time,
        status: { not: 'cancelled' }
      },
      select: { vetId: true }
    });

    const bookedVetIds = bookedVets.map(a => a.vetId);
    const availableVets = vets.filter(vet => !bookedVetIds.includes(vet.id));

    if (availableVets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No veterinarians available for this time slot'
      });
    }

    // Return reandom available vet
    const randomVet = availableVets[Math.floor(Math.random() * availableVets.length)];

    res.status(200).json({
      success: true,
      data: { veterinarian: randomVet }
    });
  } catch (error) {
    next(error);
  }
};
