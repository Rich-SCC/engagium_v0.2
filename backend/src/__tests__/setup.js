// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'engagium_test';
process.env.DB_USER = 'engagium_user';
process.env.DB_PASSWORD = 'engagium_password';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Increase timeout for database operations
jest.setTimeout(10000);
