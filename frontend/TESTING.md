# Frontend Testing Guide

## Overview

The frontend uses **Vitest** as the test runner and **React Testing Library** for component testing. This setup provides a fast, modern testing experience with excellent developer tooling.

## Setup

### Install Dependencies

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (recommended during development)
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.js           # Global test setup
│   ├── test-utils.jsx     # Custom render functions and mocks
│   ├── pages/             # Page component tests
│   │   ├── Home.test.jsx
│   │   └── LiveFeed.test.jsx
│   └── components/        # Reusable component tests
```

## Writing Tests

### Basic Component Test

```javascript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Testing with User Interactions

```javascript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import MyButton from '@/components/MyButton';

describe('MyButton', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(<MyButton onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with API Mocks

```javascript
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import * as api from '@/services/api';
import MyPage from '@/pages/MyPage';

vi.mock('@/services/api', () => ({
  myAPI: {
    getData: vi.fn(),
  },
}));

describe('MyPage', () => {
  it('loads and displays data', async () => {
    api.myAPI.getData.mockResolvedValue({ data: { name: 'Test' } });
    
    renderWithProviders(<MyPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

## Test Utilities

### `renderWithProviders`

Custom render function that wraps components with necessary providers (Router, QueryClient, etc.).

```javascript
import { renderWithProviders } from '@/test/test-utils';

const { container, queryClient } = renderWithProviders(<MyComponent />);
```

### Mock Contexts

Pre-configured mock contexts are available in `test-utils.jsx`:

- `mockAuthContext` - Mock authentication state
- `mockWebSocketContext` - Mock WebSocket connection

## Best Practices

1. **Test user behavior, not implementation details**
   - Focus on what users see and do
   - Avoid testing internal state or methods

2. **Use semantic queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Test accessibility**
   - Ensure components are accessible
   - Use proper ARIA labels and roles

4. **Keep tests isolated**
   - Each test should be independent
   - Clean up after each test (handled automatically)

5. **Mock external dependencies**
   - Mock API calls
   - Mock third-party libraries when needed

## Coverage

Run coverage reports to identify untested code:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Troubleshooting

### Tests fail with "Not wrapped in act(...)"
- Use `waitFor` for async operations
- Ensure all promises are resolved

### Mock not working
- Check that mock is defined before component import
- Use `vi.clearAllMocks()` in `beforeEach`

### CSS or style-related errors
- Check that `css: true` is in `vite.config.js`
- Ensure test setup includes necessary polyfills

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
