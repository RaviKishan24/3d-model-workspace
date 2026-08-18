const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const modelRoutes = require('./routes/modelRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Behind an ALB / CloudFront: needed for secure cookies and real client IPs.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server requests with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // required for HTTP-only auth cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ALB / Auto Scaling health check target. Must stay unauthenticated and cheap.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
