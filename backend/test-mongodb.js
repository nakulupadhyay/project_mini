const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcare-ai';

console.log('🔍 Testing MongoDB Connection...');
console.log(`📍 Connection String: ${MONGODB_URI.split('@')[1] || 'Local MongoDB'}`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ MongoDB Connection Successful!');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log(`🖥️  Host: ${mongoose.connection.host}`);
  console.log(`🔌 Port: ${mongoose.connection.port}`);
  mongoose.connection.close();
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB Connection Failed!');
  console.error('Error Details:', err.message);
  process.exit(1);
});
