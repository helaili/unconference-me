# User Management and Registration

This document describes the user management and registration features implemented for the Unconference Me application.

## Overview

The application now supports comprehensive user registration and management features, allowing:
- Self-service registration for participants
- Admin-managed user creation with invitation links
- CSV bulk import of users
- GitHub OAuth integration for authentication
- Role-based access control (Admin, Organizer, Participant)

## User Roles

### Participant
- Default role for registered users
- Can submit topics
- Can view events and participate in discussions

### Organizer
- Can manage events
- Can approve topics
- Can manage participants

### Admin
- Full system access
- Can manage users
- Can access user management page
- Can generate registration links
- Can import users via CSV

## Registration Flow

### Self-Registration (Local Auth)

1. User visits `/register`
2. Fills in:
   - First Name
   - Last Name
   - Email
   - Password (min 8 characters)
   - Confirm Password
3. Submits form
4. Account is created with role "Participant"
5. User is redirected to login page

### Registration with Invitation Link

1. Admin creates user in User Management page
2. Admin generates registration link for user
3. User receives link (via email, etc.)
4. User clicks link: `/register?token=xxx`
5. Form is pre-filled with user's information
6. User completes registration by setting password
7. Account is activated

### GitHub OAuth Registration

When `NUXT_AUTH_GITHUB` is enabled:

1. User visits `/register`
2. Fills in basic information
3. Clicks "Register with GitHub"
4. Redirected to GitHub for authentication
5. Upon return, account is created/linked
6. User is logged in and redirected to dashboard

**Note**: When using GitHub OAuth, password fields are not shown in the registration form.

## User Management (Admin Only)

### Accessing User Management

1. Login as Admin user
2. Navigate to "Users" from the sidebar navigation
3. User management page displays all users in a table

### Add Single User

1. Click "Add User" button
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Role (Admin, Organizer, or Participant)
3. Click "Add"
4. User is created with a registration token
5. Generate registration link to send to user

### Bulk Import via CSV

1. Click "Import CSV" button
2. Prepare CSV file with columns: `firstname,lastname,email`
3. Example:
   ```csv
   firstname,lastname,email
   John,Doe,john@example.com
   Jane,Smith,jane@example.com
   ```
4. Paste CSV content into text area
5. Click "Import"
6. Users are created with registration tokens
7. Generate registration links for imported users

### Generate Registration Links

1. Find user in the list
2. Click "Link" button for that user
3. Registration link is displayed
4. Click "Copy Link" to copy to clipboard
5. Send link to user via email or other channel
6. Link is valid for 30 days

### Regenerate Registration Links

1. Click "Link" button for existing user
2. Click "Regenerate" button
3. New token is generated
4. Previous link becomes invalid
5. Copy and send new link to user

### Delete User

1. Find user in the list
2. Click "Delete" button
3. Confirm deletion
4. User is permanently removed

## API Endpoints

### Registration
- `POST /api/auth/register` - Register new user
  - Body: `{ firstname, lastname, email, password?, token? }`
  
### Authentication
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`

### Token Validation
- `GET /api/auth/check-token?token=xxx` - Validate registration token

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
  - Body: `{ firstname, lastname, email, role }`
- `DELETE /api/users/:email` - Delete user
- `POST /api/users/generate-link` - Generate registration link
  - Body: `{ email }`
- `POST /api/users/import-csv` - Import users from CSV
  - Body: `{ csvData }`

## Security Features

### Password Requirements
- Minimum 8 characters
- Stored securely (should be hashed in production)

### Registration Tokens
- 32-byte random tokens
- 30-day expiration
- Single-use (cleared after registration)
- URL-safe hex encoding

### Session Management
- Secure session cookies
- Role-based access control
- Protected API endpoints

### Data Privacy
- Passwords excluded from API responses
- Admin-only endpoints require authentication
- CSRF protection (built into Nuxt)

## GitHub OAuth Integration

### Configuration

Set environment variables:
```env
NUXT_AUTH_GITHUB=true
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### OAuth Flow

1. User clicks "Register with GitHub" or "Login with GitHub"
2. Redirected to GitHub authorization page
3. User authorizes application
4. GitHub redirects back with code
5. Application exchanges code for access token
6. GitHub user profile is retrieved
7. User account is created/linked based on:
   - GitHub ID (primary)
   - Email address (secondary)
   - Registration token (if provided)

### Email Mapping

When a registration token is provided:
1. System looks up user by token
2. Validates token hasn't expired
3. Maps GitHub profile to existing user record
4. Clears registration token
5. User is authenticated

## Mobile Compatibility

All pages are mobile-responsive:
- Registration form adapts to mobile screens
- User management table is mobile-friendly
- Dialogs adjust for mobile viewports
- Buttons become block-level on mobile
- Touch-friendly target sizes (44px minimum)

## Testing

Comprehensive test suites are provided:
- `tests/registration.spec.ts` - Registration flow tests
- `tests/user-management.spec.ts` - User management tests

Run tests:
```bash
APP_ENV=copilot npm test
```

## Troubleshooting

### Registration Link Not Working
- Check token hasn't expired (30 days)
- Verify user exists in system
- Try regenerating link

### GitHub OAuth Not Working
- Verify NUXT_AUTH_GITHUB is set to "true"
- Check GitHub OAuth app configuration
- Verify callback URL is correct

### Cannot Access User Management
- Ensure logged in as Admin user
- Check user role in database
- Verify session is active

## Future Enhancements

Potential improvements:
- Email notifications with registration links
- Password reset functionality
- Email verification
- Two-factor authentication
- User profile editing
- Activity logging
- Batch operations (bulk delete, bulk role change)
- Advanced user filtering and search
- User status management (active, inactive, suspended)
