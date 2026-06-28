// server.js
import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🏥 Health check available at:`);
  console.log(`   - http://localhost:${PORT}/api/health`);
  console.log(`   - http://localhost:${PORT}/health`);
  console.log(`   - http://localhost:${PORT}/`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});