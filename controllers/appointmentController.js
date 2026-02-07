import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { sendAppointmentEmail } from '../utils/emailService.js';

const prisma = new PrismaClient();

// @desc    Get all appointments for current user
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.id },
      include: {
        pet: true,
        vet: true
      },
      orderBy: { appointmentDate: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      },
      include: {
        pet: true,
        vet: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res, next) => {
  try {
    const { petId, appointmentDate, appointmentTime, reason, paymentMethod } = req.body;

    // Validation
    if (!petId || !appointmentDate || !appointmentTime || !paymentMethod) {
      throw new AppError('Please provide all required fields', 400);
    }

    if (!['pay_now', 'pay_later'].includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: {
        id: parseInt(petId),
        userId: req.user.id
      }
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    // Check if the appointment time is in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime < new Date()) {
      throw new AppError('Janji temu harus di masa depan', 400);
    }

    // Get available vet for this time slot
    const bookedVets = await prisma.appointment.findMany({
      where: {
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { not: 'cancelled' }
      },
      select: { vetId: true }
    });

    const bookedVetIds = bookedVets.map(a => a.vetId);

    const availableVet = await prisma.veterinarian.findFirst({
      where: {
        available: true,
        id: { notIn: bookedVetIds }
      }
    });

    if (!availableVet) {
      throw new AppError('No veterinarians available for this time slot', 400);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user.id,
        petId: parseInt(petId),
        vetId: availableVet.id,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        reason: reason || null,
        paymentMethod,
        status: 'scheduled'
      },
      include: {
        pet: true,
        vet: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Send email notifications
    try {
      await sendAppointmentEmail(appointment);
    } catch (emailError) {
      console.error('Email sending failed', emailError);
      // Don't fail the appointment creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Appoinment created successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, appointmentTime, reason, status } = req.body;

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!existingAppointment) {
      throw new AppError('Appoinment not found', 404);
    }

    // Validate status if provided
    if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        appointmentDate: appointmentDate ? new Date(appointmentDate) : existingAppointment.appointmentDate,
        appointmentTime: appointmentTime || existingAppointment.appointmentTime,
        reason: reason !== undefined ? reason : existingAppointment.reason,
        status: status || existingAppointment.status
      },
      include: {
        pet: true,
        vet: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Appoinment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const cancelAppointment = async (req, res, next) => {
  try {
    // Check if appointment exists and belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id
      }
    });

    if (!appointment) {
      throw new AppError('Appoinment not found', 404);
    }

    // Update status to cancelled instead of deleting
    await prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' }
    });

    res.status(200).json({
      success: true,
      message: 'Appoinment cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available time slots
// @route   GET /api/appointments/slots/:date
// @access  Private
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!date) {
      throw new AppError('Please provide a date', 400);
    }

    // Generate time slots from 9 AM to 9 PM (30 min intervals)
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked appointments for this date
    const appointmentDate = new Date(date);
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
          lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
        },
        status: { not: 'cancelled' }
      },
      include: {
        vet: true
      }
    });

    // Get total number of available vets
    const totalVets = await prisma.veterinarian.count({
      where: { available: true }
    });

    // Check which slots are fully booked
    const availableSlots = slots.filter(slot => {
      const bookedForSlot = bookedAppointments.filter(apt => apt.appointmentTime === slot).length;
      return bookedForSlot < totalVets;
    });

    res.status(200).json({
      success: true,
      data: {
        date,
        availableSlots,
        // totalSlots: slots.length //total slots only
        totalAvailableSlots: availableSlots.length
      }
    });
  } catch (error) {
    next(error);
  }
};
