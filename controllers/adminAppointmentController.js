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

// @desc    Get available slots for a specific vet on a specific date
// @route   GET /api/admin/appointments/available-slots
// @access  Private (Admin)
export const getAvailableSlotsForVet = async (req, res, next) => {
  try {
    const { date, vetId } = req.query;

    if (!date || !vetId) {
      throw new AppError('Please provide both date and vetId', 400);
    }

    // Generate time slots from 9 AM to 9 PM (30 min intervals)
    const allSlots = [];
    for (let hour = 9; hour < 21; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked appointments for this vet on this date
    const appointmentDate = new Date(date);
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        vetId: parseInt(vetId),
        appointmentDate: {
          gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
          lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
        },
        status: { not: 'cancelled' }
      },
      select: {
        appointmentTime: true,
        bookingType: true
      }
    });

    // Filter out booked slots
    const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({
      success: true,
      data: {
        date,
        vetId: parseInt(vetId),
        availableSlots,
        bookedSlots: bookedTimes,
        totalSlots: allSlots.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual appointment (offline booking or blocked slot)
// @route   POST /api/admin/appointments/manual
// @access  Private (Admin)
export const createManualAppointment = async (req, res, next) => {
  try {
    const {
      vetId,
      appointmentDate,
      appointmentTime,
      bookingType, // 'offline' or 'blocked'
      offlineClientName,
      offlineClientPhone,
      offlinePetName,
      offlinePetType,
      adminNotes
    } = req.body;

    // Validation
    if (!vetId || !appointmentDate || !appointmentTime || !bookingType) {
      throw new AppError('Please provide vetId, appointmentDate, appointmentTime, and bookingType', 400);
    }

    if (!['offline', 'blocked'].includes(bookingType)) {
      throw new AppError('bookingType must be either "offline" or "blocked"', 400);
    }

    // Validate offline booking fields
    if (bookingType === 'offline') {
      if (!offlineClientName || !offlineClientPhone || !offlinePetName || !offlinePetType) {
        throw new AppError('For offline bookings, please provide client name, phone, pet name, and pet type', 400);
      }
    }

    // Verify vet exists
    const vet = await prisma.veterinarian.findUnique({
      where: { id: parseInt(vetId) }
    });

    if (!vet) {
      throw new AppError('Veterinarian not found', 404);
    }

    // Check if slot is already booked
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        vetId: parseInt(vetId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { not: 'cancelled' }
      }
    });

    if (existingAppointment) {
      throw new AppError('This time slot is already booked for this veterinarian', 400);
    }

    // Create appointment
    const appointmentData = {
      vetId: parseInt(vetId),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      bookingType,
      status: 'scheduled',
      adminNotes: adminNotes || null
    };

    if (bookingType === 'offline') {
      appointmentData.offlineClientName = offlineClientName;
      appointmentData.offlineClientPhone = offlineClientPhone;
      appointmentData.offlinePetName = offlinePetName;
      appointmentData.offlinePetType = offlinePetType;
    }

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        vet: true
      }
    });

    res.status(201).json({
      success: true,
      message: bookingType === 'offline'
        ? 'Offline appointment created successfully'
        : 'Time slot blocked successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete manual appointment
// @route   DELETE /api/admin/appointments/manual/:id
// @access  Private (Admin)
export const deleteManualAppointment = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id);

    // Check if appointment exists and is manual (offline or blocked)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.bookingType === 'online') {
      throw new AppError('Cannot delete online bookings through this endpoint', 400);
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    res.status(200).json({
      success: true,
      message: 'Manual appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
