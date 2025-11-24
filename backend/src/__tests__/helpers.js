const db = require('../config/database');

// Mock database helper
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: jest.fn(),
  end: jest.fn(),
};

// Test data generators
const testHelpers = {
  // Generate test user data
  generateUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'instructor',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  // Generate test class data
  generateClass: (overrides = {}) => ({
    id: 1,
    instructor_id: 1,
    name: 'Test Class',
    subject: 'Computer Science',
    section: 'A',
    description: 'Test class description',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  // Generate test session data
  generateSession: (overrides = {}) => ({
    id: 1,
    class_id: 1,
    title: 'Test Session',
    meeting_link: 'https://meet.example.com/test',
    status: 'scheduled',
    start_time: null,
    end_time: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  // Generate test student data
  generateStudent: (overrides = {}) => ({
    id: 1,
    class_id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    student_id: 'STU001',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  // Generate test participation log
  generateParticipationLog: (overrides = {}) => ({
    id: 1,
    session_id: 1,
    student_id: 1,
    interaction_type: 'chat',
    interaction_value: 1,
    additional_data: null,
    timestamp: new Date(),
    ...overrides
  }),

  // Mock JWT token
  generateToken: () => 'test-jwt-token',

  // Mock request object
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    header: jest.fn(),
    user: testHelpers.generateUser(),
    app: {
      get: jest.fn()
    },
    ...overrides
  }),

  // Mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  mockNext: () => jest.fn(),

  // Mock database query
  mockDbQuery: (returnValue) => {
    mockQuery.mockResolvedValueOnce({ rows: returnValue });
    return mockQuery;
  },

  // Mock database error
  mockDbError: (error) => {
    mockQuery.mockRejectedValueOnce(error);
    return mockQuery;
  },

  // Clear all mocks
  clearAllMocks: () => {
    jest.clearAllMocks();
    mockQuery.mockClear();
  }
};

module.exports = { testHelpers, mockQuery, mockPool };
