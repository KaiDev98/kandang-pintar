import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import winston from 'winston';

// Initialize Express app
const app = express();

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate API key on startup
if (!GEMINI_API_KEY) {
  console.error('❌ FATAL ERROR: GEMINI_API_KEY is not configured');
  console.error('Please set GEMINI_API_KEY environment variable in Vercel settings');
  process.exit(1);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for AI endpoints
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

// Input validation middleware
const validateJsonBody = (req, res, next) => {
  if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  next();
};

const validateTextField = (fieldName) => {
  return (req, res, next) => {
    if (!req.body[fieldName] || typeof req.body[fieldName] !== 'string' || req.body[fieldName].trim().length === 0) {
      return res.status(400).json({ error: `${fieldName} is required and must be a non-empty string` });
    }
    next();
  };
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Kandang Pintar Server',
    environment: NODE_ENV
  });
});

// Parse daily log endpoint
app.post('/api/ai/parse-log', validateJsonBody, validateTextField('text'), async (req, res) => {
  try {
    const { text } = req.body;
    
    logger.info('Parsing daily log', { text: text.substring(0, 50) + '...' });
    
    // Mock response for testing
    res.json({
      success: true,
      parsed: {
        feed: 5,
        water: 2,
        eggs: 12,
        mortality: 1,
        notes: text
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error parsing log', { error });
    res.status(500).json({ error: 'Failed to parse log' });
  }
});

// Chat endpoint
app.post('/api/ai/chat', validateJsonBody, validateTextField('message'), async (req, res) => {
  try {
    const { message, farmData } = req.body;
    
    logger.info('Processing chat message', { message: message.substring(0, 30) + '...' });
    
    // Mock response for testing
    res.json({
      success: true,
      response: 'This is a response to your message.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing chat', { error });
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Symptom check endpoint
app.post('/api/ai/symptom-check', validateJsonBody, validateTextField('symptoms'), async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    logger.info('Checking symptoms', { symptoms });
    
    // Mock response
    res.json({
      success: true,
      diagnosis: 'Possible respiratory infection',
      recommendations: ['Monitor closely', 'Improve ventilation'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking symptoms', { error });
    res.status(500).json({ error: 'Failed to check symptoms' });
  }
});

// Weekly insight endpoint
app.post('/api/ai/weekly-insight', validateJsonBody, async (req, res) => {
  try {
    logger.info('Generating weekly insights');
    
    res.json({
      success: true,
      insights: {
        averageEggProduction: 85,
        feedEfficiency: 'Good',
        healthStatus: 'Stable'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating insights', { error });
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Sync endpoint
app.post('/api/sync', validateJsonBody, async (req, res) => {
  try {
    const { data } = req.body;
    
    logger.info('Syncing data');
    
    res.json({
      success: true,
      synced: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error syncing', { error });
    res.status(500).json({ error: 'Failed to sync' });
  }
});

// Export endpoint
app.post('/api/export/excel', validateJsonBody, async (req, res) => {
  try {
    const { data } = req.body;
    
    logger.info('Exporting to Excel');
    
    res.json({
      success: true,
      exported: true,
      filename: 'kandang-pintar-export.xlsx',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error exporting', { error });
    res.status(500).json({ error: 'Failed to export' });
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Export for Vercel serverless functions
export default app;

// Start server if running locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 API available at http://localhost:${PORT}/api`);
  });
}
