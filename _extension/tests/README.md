# Extension Testing Guide

This directory contains automated tests for the Engagium Chrome Extension.

## Test Structure

```
tests/
├── setup.js              # Test environment setup and mocks
├── unit/                 # Unit tests for individual modules
│   ├── utils.test.js
│   ├── storage.test.js
│   └── student-matcher.test.js
└── integration/          # Integration tests
    ├── popup.test.jsx
    └── background.test.js
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- utils.test.js
```

## Test Coverage

The tests cover:

### Unit Tests
- **Date Utils**: Time formatting, duration calculations
- **Storage Utils**: Chrome storage API interactions
- **Student Matcher**: Name matching algorithms
- **Constants**: Configuration values

### Integration Tests
- **Popup**: Message passing, state management
- **Background**: Session management, storage operations
- **Content Scripts**: DOM interactions, event detection

## Writing New Tests

### Unit Test Example

```javascript
import { myFunction } from '../../utils/myModule.js';

describe('MyModule', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example

```javascript
describe('Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle user interaction', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'TEST' });
    expect(response.success).toBe(true);
  });
});
```

## Mocked Chrome APIs

The following Chrome APIs are mocked in `setup.js`:

- `chrome.runtime` - Message passing
- `chrome.storage.local` - Local storage
- `chrome.storage.sync` - Sync storage
- `chrome.tabs` - Tab management
- `chrome.action` - Extension icon/badge

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format
