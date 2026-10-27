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
import syncRoutes from './routes/sync.js';
import billingRoutes from './routes/billing.js';
import adminRoutes from './routes/admin.js';
import { startReconciliationWorker } from './services/reconciliationService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());

// Raw body capture for webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Start background reconciliation worker
if (process.env.NODE_ENV !== 'test') {
  startReconciliationWorker();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Root endpoint for Vercel
app.get('/', (req, res) => {
  res.send('Uravuu API is successfully deployed and running!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for Vercel serverless
export default app;
