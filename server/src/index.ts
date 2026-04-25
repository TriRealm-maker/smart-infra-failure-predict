import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import weatherRoutes from './routes/weatherRoutes';
import placesRoutes from './routes/placesRoutes';
import predictionRoutes from './routes/predictionRoutes';
import medicalRoutes from './routes/medicalRoutes';
import sosRoutes from './routes/sosRoutes';
import debugRoutes from './routes/debugRoutes';

// Required environment variables:
// MONGODB_URI — MongoDB Atlas connection string
// JWT_SECRET — any long random string
// NODE_ENV — "production"
// PORT — set automatically by Render (do not hardcode)
// OPENWEATHER_API_KEY — from openweathermap.org
// GROQ_API_KEY — from console.groq.com (free, no credit card)

const app: Express = express();

const baseAllowedOrigins = [
  'http://localhost:5173',
  'https://crisisguard.vercel.app',
];
const clientUrl = process.env.CLIENT_URL?.trim();
const allowedOrigins = clientUrl
  ? [...baseAllowedOrigins, clientUrl]
  : baseAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, curl, mobile apps
      if (!origin) return callback(null, true);

      // Allow localhost + main prod + all Vercel previews
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', weatherRoutes);
app.use('/api', placesRoutes);
app.use('/api', predictionRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/debug', debugRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrisisGuard API is running' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
