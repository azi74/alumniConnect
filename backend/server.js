const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const studentRoutes = require('./routes/studentRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const rateLimit = require('express-rate-limit');
const path = require('path');
const notificationsRoutes = require('./routes/notificationsRoutes');
const messagesRoutes = require('./routes/messagesRoutes');

dotenv.config();

const app = express();

// ====== Connect to MongoDB ======
connectDB();

// ====== Global Middleware ======
app.use(cors({
  origin: 'https://alumni-connect-gamma.vercel.app/',
  credentials: true,
}));

app.use(express.json());

// ====== Rate Limiting for Auth Routes ======
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== Routes ======
app.use('/api/auth', authRoutes);

// ====== Error Handler ======
app.use(errorHandler);

// ====== Start Server ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));