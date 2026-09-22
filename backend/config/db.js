const mongoose = require('mongoose');

let isUsingMock = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('\n⚠️  WARNING: MONGO_URI or MONGODB_URI not found in .env file.');
    console.log('🔌  Using in-memory/JSON-file fallback database. Ideal for quick offline testing.\n');
    isUsingMock = true;
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log(`📡 MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('🔌 Falling back to in-memory/JSON-file database.\n');
    isUsingMock = true;
    return false;
  }
};

module.exports = {
  connectDB,
  isUsingMock: () => isUsingMock
};
