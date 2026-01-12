// test
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import petRoutes from './routes/petRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import veterinarianRoutes from './routes/veterinarianRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminAppointmentRoutes from './routes/adminAppointmentRoutes.js';
import adminVeterinarianRoutes from './routes/adminVeterinarianRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/veterinarians', veterinarianRoutes);

// Admin Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/appointments', adminAppointmentRoutes);
app.use('/api/admin/veterinarians', adminVeterinarianRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
