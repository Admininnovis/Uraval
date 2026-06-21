import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import personRoutes from './routes/person.js';
import eventRoutes from './routes/event.js';
import ledgerRoutes from './routes/ledger.js';
import reportRoutes from './routes/report.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
