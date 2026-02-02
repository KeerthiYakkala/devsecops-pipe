/**
 * DevSecOps Demo - Node.js Express Application
 * 
 * This application demonstrates security best practices that should
 * pass security scanners when properly configured.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();

// =============================================================================
// Security Middleware
// =============================================================================

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// =============================================================================
// Application State (In-memory for demo - use database in production)
// =============================================================================

const items = new Map();

// =============================================================================
// Routes
// =============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    app: 'DevSecOps Demo API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      items: '/api/items',
      item: '/api/items/:id'
    }
  });
});

// Health check for container orchestration
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      app: 'ok',
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warning'
    }
  });
});

// Readiness probe
app.get('/ready', (req, res) => {
  // In production, check database connections, external services, etc.
  res.json({ ready: true });
});

// Get all items
app.get('/api/items', (req, res) => {
  const itemList = Array.from(items.values());
  res.json({
    items: itemList,
    count: itemList.length
  });
});

// Create new item
app.post('/api/items', (req, res) => {
  const { name, description } = req.body;

  // Input validation
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less' });
  }

  const item = {
    id: uuidv4(),
    name: name.trim().substring(0, 100),
    description: (description || '').trim().substring(0, 500),
    createdAt: new Date().toISOString()
  };

  items.set(item.id, item);
  
  console.log(`Created item: ${item.id}`);
  res.status(201).json(item);
});

// Get single item
app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid item ID format' });
  }

  const item = items.get(id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const item = items.get(id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (name) {
    item.name = name.trim().substring(0, 100);
  }
  if (description !== undefined) {
    item.description = description.trim().substring(0, 500);
  }
  item.updatedAt = new Date().toISOString();

  items.set(id, item);
  
  console.log(`Updated item: ${id}`);
  res.json(item);
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  if (!items.has(id)) {
    return res.status(404).json({ error: 'Item not found' });
  }

  items.delete(id);
  
  console.log(`Deleted item: ${id}`);
  res.json({ message: 'Item deleted successfully' });
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ error: message });
});

// =============================================================================
// Server Startup
// =============================================================================

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
