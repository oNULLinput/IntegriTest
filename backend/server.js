const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');



// Load environment variables
dotenv.config();

// Temporarily hardcode for testing
process.env.SUPABASE_URL = 'https://ipmsdfpxdueumisthrai.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXNkZnB4ZHVldW1pc3RocmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTIyNzAsImV4cCI6MjA3MjY2ODI3MH0.KdqZbMgdbcc__Xy5F-tjUr6j0cmPaidH4eku1mn40TA';
process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXNkZnB4ZHVldW1pc3RocmFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA5MjI3MCwiZXhwIjoyMDcyNjY4MjcwfQ.NA39R82LZ6z40ryR1Sn_24_VoIBYa2NyZKvDz1sBxlk';
process.env.JWT_SECRET = '1slBkyJx6s2OgAgFPDUJLYr16bp8HtzIkHOzw0yBeAfK0kXjwvaTcnVHVW7oNG62Q9cELy3pZJB4Et1FnzHv8Q==';
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://', 'null'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'IntegriTest Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      message: 'Database connection successful!',
      data: data 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IntegriTest Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
  console.log(`�� API base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});

module.exports = app;