const Redis = require('ioredis');

// Connect to Redis (localhost by default or Docker service name)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false, // Don't queue commands if disconnected
  retryStrategy: (times) => {
    // Reconnect after 3 seconds
    return 3000;
  }
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

module.exports = redis;
