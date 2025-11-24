# Engagium Backend Test Suite

This directory contains comprehensive unit and integration tests for the Engagium backend API.

## Overview

The test suite covers:
- **Models**: User, Class, Session, Student, ParticipationLog
- **Middleware**: Authentication, Authorization (instructor, admin)
- **Controllers**: Auth, Class, Session, Participation

## Test Structure

```
src/__tests__/
├── setup.js                     # Test environment configuration
├── helpers.js                   # Test utilities and mock data generators
├── models/                      # Model unit tests
│   ├── User.test.js
│   ├── Class.test.js
│   ├── Session.test.js
│   ├── Student.test.js
│   └── ParticipationLog.test.js
├── middleware/                  # Middleware tests
│   └── auth.test.js
└── controllers/                 # Controller integration tests
    ├── authController.test.js
    ├── classController.test.js
    ├── sessionController.test.js
    └── participationController.test.js
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (useful during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run tests with verbose output
```bash
npm run test:verbose
```

## Coverage Goals

The test suite aims for the following coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Categories

### Model Tests
Model tests verify database operations and business logic:
- CRUD operations (Create, Read, Update, Delete)
- Data validation and constraints
- Error handling (duplicate keys, missing data, etc.)
- Complex queries and aggregations

### Middleware Tests
Middleware tests ensure proper authentication and authorization:
- JWT token validation
- User authentication
- Role-based access control (instructor, admin)
- Error scenarios (expired tokens, invalid tokens, missing tokens)

### Controller Tests
Controller tests verify API endpoint behavior:
- Request validation
- Response formatting
- Error handling
- Authorization checks
- Business logic execution

## Test Utilities

### Helper Functions (`helpers.js`)

The test suite includes several helper functions for generating mock data:

```javascript
const { testHelpers } = require('./helpers');

// Generate test user
const user = testHelpers.generateUser({ role: 'instructor' });

// Generate test class
const testClass = testHelpers.generateClass({ name: 'CS 101' });

// Generate test session
const session = testHelpers.generateSession({ status: 'active' });

// Mock request/response objects
const req = testHelpers.mockRequest({ user, body: { ... } });
const res = testHelpers.mockResponse();

// Mock database queries
testHelpers.mockDbQuery([{ id: 1, name: 'Test' }]);
```

## Writing New Tests

### Example Model Test

```javascript
describe('MyModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new record', async () => {
    const data = { name: 'Test', value: 123 };
    db.query.mockResolvedValue({ rows: [{ id: 1, ...data }] });

    const result = await MyModel.create(data);

    expect(result).toEqual({ id: 1, ...data });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      expect.arrayContaining([data.name, data.value])
    );
  });
});
```

### Example Controller Test

```javascript
describe('myController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('should handle request successfully', async () => {
    req.body = { name: 'Test' };
    MyModel.create.mockResolvedValue({ id: 1, name: 'Test' });

    await myController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object)
    });
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (database, models) to test in isolation
3. **Clear Assertions**: Use specific assertions that clearly indicate what's being tested
4. **Descriptive Names**: Use clear test names that describe what's being tested
5. **Setup/Teardown**: Use `beforeEach` and `afterEach` to set up and clean up test state
6. **Edge Cases**: Test not just the happy path, but also error conditions and edge cases

## Common Testing Patterns

### Testing Success Cases
```javascript
it('should successfully perform action', async () => {
  // Arrange: Set up mocks and data
  Model.method.mockResolvedValue(expectedResult);

  // Act: Call the function
  await controller(req, res);

  // Assert: Verify behavior
  expect(res.json).toHaveBeenCalledWith({ success: true, data: expectedResult });
});
```

### Testing Error Cases
```javascript
it('should return 400 for invalid input', async () => {
  req.body = { /* invalid data */ };

  await controller(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    error: expect.stringContaining('error message')
  });
});
```

### Testing Authorization
```javascript
it('should return 403 if user does not have access', async () => {
  req.user = { id: 2, role: 'instructor' };
  Model.findById.mockResolvedValue({ instructor_id: 1 });

  await controller(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    error: 'Access denied'
  });
});
```

## Debugging Tests

### Run a specific test file
```bash
npm test -- User.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should create"
```

### Debug with Node inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure all tests pass before merging pull requests.

## Test Database

For integration tests that require a database, use a separate test database:
- Database: `engagium_test`
- Configure in `.env.test` or environment variables
- Tests use mocked database calls, so no actual database is required for unit tests

## Troubleshooting

### Tests Timeout
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 15000  // 15 seconds
```

### Mock Not Working
Ensure mocks are cleared between tests:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Coverage Not Generated
Make sure to run with the coverage flag:
```bash
npm run test:coverage
```

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Maintain coverage thresholds
5. Update this README if adding new test categories

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
