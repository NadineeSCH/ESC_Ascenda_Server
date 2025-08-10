const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    // Create MongoDB Memory Server instance
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use a different port to avoid conflicts
        dbName: 'testdb'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    
    // Connect mongoose to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to in-memory MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    // Close mongoose connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from in-memory MongoDB');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};

const clearDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    // Clear all collections
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Database clear error:', error);
  }
};

const getDBStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      documents: stats.objects,
      indexes: stats.indexes,
      dataSize: stats.dataSize
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return null;
  }
};

// Helper function to check if database is connected
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper function to get connection info
const getDBConnectionInfo = () => {
  if (mongoServer) {
    return {
      uri: mongoServer.getUri(),
      dbName: 'testdb',
      state: mongoose.connection.readyState
    };
  }
  return null;
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDB,
  getDBStats,
  isDBConnected,
  getDBConnectionInfo
};