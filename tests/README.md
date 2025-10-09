# Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for end-to-end testing of the Nuxt.js application.

## Setup

Playwright is already installed and configured. The setup includes:

- **Configuration**: `playwright.config.ts` - Configures test settings, browsers, and development server
- **Test Directory**: `tests/` - Contains all test files
- **Helper Classes**: `tests/helpers/` - Reusable test utilities

## Running Tests

### Local Development

```bash
# Run all tests (headless mode)
npm run test

# Run tests with browser UI visible
npm run test:headed

# Run tests in interactive UI mode
npm run test:ui

# Show test report after running tests
npm run test:report
```

### Specific Test Files

```bash
# Run only authentication tests
npx playwright test tests/auth.spec.ts

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests matching a pattern
npx playwright test --grep "login"
```

## Test Structure

### Authentication Tests (`tests/auth.spec.ts`)

Tests the login functionality with the local authentication system:

- **Form Validation**: Tests email/password validation rules
- **Invalid Credentials**: Verifies error handling for wrong credentials
- **Successful Login**: Tests login with valid users (Luke Skywalker, Darth Vader)
- **Session Persistence**: Verifies that sessions are maintained across navigation
- **Protected Routes**: Ensures unauthenticated users are redirected to login

### Test Users

The application includes two test users for authentication testing:

1. **Luke Skywalker** (Admin)
   - Email: `luke@rebels.com`
   - Password: `changeme`
   - Role: Admin

2. **Darth Vader** (User)  
   - Email: `darth@empire.com`
   - Password: `changeme`
   - Role: User

### Helper Classes

The `AuthHelper` class in `tests/helpers/auth.ts` provides convenient methods for common authentication actions:

```typescript
const auth = new AuthHelper(page);

// Login as specific users
await auth.loginAsLuke();
await auth.loginAsVader();

// Custom login
await auth.loginAs('email@example.com', 'password');

// Assertions
await auth.expectToBeOnLoginPage();
await auth.expectToBeOnDashboard();
```

## Test Data Attributes

The application uses `data-testid` attributes for reliable element selection:

- `email-input` - Email input field
- `password-input` - Password input field  
- `login-submit-button` - Login form submit button

## Continuous Integration

Tests are automatically run in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

See `.github/workflows/playwright.yml` for the CI configuration.

## Development Server

Tests automatically start the Nuxt development server on `http://localhost:3000` before running. This is configured in `playwright.config.ts` under the `webServer` section.

## Browser Support

Tests run against:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox) 
- Webkit (Desktop Safari)

Mobile browser testing is available but disabled by default.

## Debugging Tests

### Visual Debugging
```bash
# Run tests with browser visible
npm run test:headed

# Run in interactive mode with test explorer
npm run test:ui
```

### Screenshots and Videos
Playwright automatically captures screenshots on failure and can record videos. These are saved in the `test-results/` directory.

### Trace Viewer
Failed tests automatically generate trace files that can be viewed with:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Writing New Tests

1. Create test files in the `tests/` directory with `.spec.ts` extension
2. Use the existing helper classes for common actions
3. Follow the page object model pattern for complex pages
4. Use `data-testid` attributes for element selection
5. Group related tests using `test.describe()`

Example test structure:
```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```