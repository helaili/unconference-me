# Authentication and User Management

This document describes the authentication and user management features implemented in the Unconference-Me application.

## Overview

The application supports multiple authentication methods and role-based access control for participants and organizers.

## Authentication Methods

### 1. Local Authentication (Email/Password)

Users can register and login with email and password credentials.

**Registration:**
- Navigate to `/register`
- Fill in first name, last name, email, and password
- Optionally use an invitation token for event-specific registration

**Login:**
- Navigate to `/login`
- Enter email and password
- Session is maintained via secure cookies

### 2. GitHub OAuth

Users can authenticate using their GitHub account.

**OAuth Flow:**
1. User clicks "Sign in with GitHub"
2. Redirects to GitHub for authorization
3. On success, GitHub profile is linked to the user account
4. If an invitation email is pending, it's matched with the GitHub profile email
5. User is redirected to the dashboard

**Email Mapping:**
The system automatically maps GitHub accounts to existing participants based on:
- GitHub email matching invitation email
- GitHub ID for returning users
- Invitation token in session

## User Roles

The system supports four user roles:

### 1. Admin
- Full system access
- Can manage all users and events
- Can assign organizer roles
- Can access all administrative pages

### 2. Organizer
- Event-specific administrative access
- Can manage participants for assigned events
- Can approve topics and manage assignments
- Three organizer sub-roles: Owner, Admin, Moderator

### 3. Participant
- Can register for events
- Can submit and rank topics
- Can view assignments
- Limited to participant-level access

### 4. User
- Basic authenticated user
- Can access dashboard
- Can be upgraded to other roles

## Invitation System

### Generating Invitation Links

Admins can generate invitation links for participants:

1. Navigate to `/users` (admin only)
2. Find the user in the list
3. Click "Generate Link" or "Regenerate Link"
4. Copy the generated invitation URL
5. Share with the participant

**Invitation Token Properties:**
- Valid for 7 days
- One-time use (token is cleared after registration)
- Tied to specific email address
- Can be regenerated if expired

### Using Invitation Links

Participants receive an invitation link like:
```
https://your-domain.com/register?token=abc123xyz&email=participant@example.com
```

When accessing this link:
- Email is pre-filled and locked
- Token is validated before registration
- User is automatically assigned Participant role
- Linked to the event specified in the invitation

## User Management (Admin Only)

### Accessing User Management

Navigate to `/users` (requires Admin role)

### Features

**User List:**
- View all registered users
- See user roles with color-coded badges
- Check GitHub connection status
- View registration dates

**Actions:**
- Generate/regenerate invitation links
- Assign organizer roles
- View user details

### Assigning Organizer Roles

1. Click "Make Organizer" button next to a user
2. Select organizer role level:
   - **Owner**: Full event management
   - **Admin**: Event editing and participant management
   - **Moderator**: Topic and participant approval
3. Permissions are automatically assigned based on role
4. User's role is updated to "Organizer"

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `GET /auth/github` - GitHub OAuth callback

### User Management

- `GET /api/users` - List all users (admin only)
- `POST /api/users/[id]/invitation` - Generate invitation token (admin only)

### Organizer Management

- `GET /api/events/[id]/organizers` - List event organizers
- `POST /api/events/[id]/organizers` - Assign organizer role (admin/organizer only)

## Security Features

### Token Security
- Invitation tokens expire after 7 days
- Tokens are single-use and cleared after registration
- Secure random token generation

### Access Control
- Role-based middleware on protected routes
- Admin-only access to user management
- Session-based authentication
- Secure password storage (in production, use bcrypt)

### Validation
- Zod schema validation on all inputs
- Email format validation
- Password minimum length (8 characters)
- Role permission verification

## Integration with Existing Systems

### MockDataManager

The authentication system integrates with the centralized mock data manager:

```typescript
// Get user by email
const user = mockData.getUserByEmail(email)

// Generate invitation token
const token = mockData.generateInvitationToken(email, eventId)

// Validate token
const validatedUser = mockData.validateInvitationToken(token)

// Get user by GitHub ID
const user = mockData.getUserByGithubId(githubId)
```

### Participant Linking

When a participant registers with an invitation token:
1. Existing participant record (if any) is linked to the new user
2. User ID is added to participant record
3. Participant status is updated to "confirmed"

## Mobile Compatibility

All authentication pages are fully responsive:
- Registration form adapts to mobile screens
- User management table optimized for small screens
- Touch-friendly buttons (minimum 44px)
- Dialogs scale appropriately

## Development and Testing

### Mock Data

Default users for testing:
- Luke Skywalker (`luke@rebels.com`) - Admin
- Darth Vader (`darth@empire.com`) - User

### Testing Invitation Flow

```typescript
// In tests
const testEmail = 'test@example.com'
mockData.addUser({ 
  id: 'test-user',
  email: testEmail,
  firstname: 'Test',
  lastname: 'User'
})

const token = mockData.generateInvitationToken(testEmail)
// Use token in registration test
```

## Future Enhancements

Potential improvements for production:
- Rate limiting on registration endpoint
- Email verification for registrations
- Password reset functionality
- Two-factor authentication
- Audit log for role changes
- Bulk invitation generation
- Custom invitation email templates
- User profile management

## Environment Variables

Required for production:
```bash
# GitHub OAuth (optional)
GITHUBAPP_CLIENT_ID=your_github_client_id
GITHUBAPP_CLIENT_SECRET=your_github_client_secret
NUXT_AUTH_GITHUB=true

# Session security
NUXT_SESSION_PASSWORD=your_secure_session_password

# Site URL for invitation links
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Troubleshooting

### Common Issues

**Invitation link expired:**
- Generate a new invitation link from user management page
- Default expiry is 7 days

**GitHub OAuth not linking:**
- Ensure GitHub email matches invitation email
- Check that invitation token is in session
- Verify OAuth credentials are configured

**Cannot access user management:**
- Ensure logged-in user has Admin role
- Check authentication middleware is applied

**Token validation fails:**
- Verify token hasn't expired
- Check email matches the invitation
- Ensure token hasn't been used already

## Support

For issues or questions about authentication, please refer to:
- Main README.md for setup instructions
- GitHub issues for bug reports
- Developer documentation in `/docs`
