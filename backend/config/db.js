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
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timed out after 5000ms (check MongoDB Atlas IP whitelist)')), 5000)
    );

    const connectPromise = mongoose.connect(mongoURI, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    const conn = await Promise.race([connectPromise, timeoutPromise]);
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
