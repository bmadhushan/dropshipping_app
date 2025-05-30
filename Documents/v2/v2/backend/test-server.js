import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ 
    success: true, 
    message: 'Server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Login test route
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({
    success: true,
    message: 'Login test successful',
    user: { username: 'test', role: 'admin' },
    token: 'test-token'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/test`);
});