# Testing Quick Reference

## Run Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Verbose output
npm run test:verbose

# Run specific file
npm test -- User.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

## Test Files Location
```
backend/src/__tests__/
├── models/           # Model unit tests
├── middleware/       # Middleware tests
├── controllers/      # Controller integration tests
├── setup.js         # Test environment config
└── helpers.js       # Test utilities
```

## Test Results Summary
- ✅ **142 tests passing**
- ⏱️ **~7-10 seconds** execution time
- 📊 **Models**: 97.59% coverage
- 🔐 **Middleware**: 88.88% coverage
- 🎮 **Controllers**: 60.62% coverage

## Writing New Tests

### Model Test Template
```javascript
describe('MyModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform action', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await MyModel.action();
    expect(result).toEqual({ id: 1 });
  });
});
```

### Controller Test Template
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

  it('should handle request', async () => {
    req.body = { data: 'test' };
    await myController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

## Test Helpers

```javascript
const { testHelpers } = require('./helpers');

// Generate mock data
const user = testHelpers.generateUser();
const classData = testHelpers.generateClass();
const session = testHelpers.generateSession();
const student = testHelpers.generateStudent();

// Mock request/response
const req = testHelpers.mockRequest({ user, body: {} });
const res = testHelpers.mockResponse();

// Mock database
testHelpers.mockDbQuery([{ id: 1 }]);
```

## Common Assertions

```javascript
// Status codes
expect(res.status).toHaveBeenCalledWith(200);
expect(res.status).toHaveBeenCalledWith(400);
expect(res.status).toHaveBeenCalledWith(401);
expect(res.status).toHaveBeenCalledWith(403);
expect(res.status).toHaveBeenCalledWith(404);

// Response format
expect(res.json).toHaveBeenCalledWith({
  success: true,
  data: expect.any(Object)
});

// Errors
expect(res.json).toHaveBeenCalledWith({
  success: false,
  error: expect.stringContaining('message')
});

// Database calls
expect(db.query).toHaveBeenCalledTimes(1);
expect(db.query).toHaveBeenCalledWith(
  expect.stringContaining('SELECT'),
  expect.arrayContaining([1])
);
```

## Debugging

```bash
# Run with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Show individual test results
npm run test:verbose

# Check for open handles
npm test -- --detectOpenHandles
```

## Coverage Targets
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Resources
- Full guide: `src/__tests__/README.md`
- Summary: `TESTING_SUMMARY.md`
- Jest docs: https://jestjs.io
