import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// @desc    Get all appointments (admin view)
// @route   GET /api/admin/appointments
// @access  Private (Admin)
export const getAllAppointments = async (req, res, next) => {
  try {
    const { status, date, vetId } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      filter.appointmentDate = {
        gte: startDate,
        lt: endDate
      };
    }

    if (vetId) {
      filter.vetId = parseInt(vetId);
    }

    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        pet: true,
        vet: true
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { appointmentTime: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PUT /api/admin/appointments/:id/status
// @access  Private (Admin)
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointmentId = parseInt(req.params.id);

    // Validate status
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status. Must be: scheduled, completed, cancelled, or no-show', 400);
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Update status
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        pet: true,
        vet: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Appointment marked as ${status}`,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointment statistics
// @route   GET /api/admin/appointments/stats
// @access  Private (Admin)
export const getAppointmentStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'scheduled'
      }
    });

    // Total scheduled
    const totalScheduled = await prisma.appointment.count({
      where: { status: 'scheduled' }
    });

    // Total completed
    const totalCompleted = await prisma.appointment.count({
      where: { status: 'completed' }
    });

    // Total no-shows
    const totalNoShows = await prisma.appointment.count({
      where: { status: 'no-show' }
    });

    // Total cancelled
    const totalCancelled = await prisma.appointment.count({
      where: { status: 'cancelled' }
    });

    // Total users
    const totalUsers = await prisma.user.count();

    // Total pets
    const totalPets = await prisma.pet.count();

    res.status(200).json({
      success: true,
      data: {
        today: todayAppointments,
        scheduled: totalScheduled,
        completed: totalCompleted,
        noShows: totalNoShows,
        cancelled: totalCancelled,
        totalUsers,
        totalPets
      }
    });
  } catch (error) {
    next(error);
  }
};
