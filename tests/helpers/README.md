# Centralized Mock Management System

This document describes the centralized mock management system for the Unconference-Me application tests.

## Overview

The centralized mock management system provides a single source of truth for all mock data used across the application, both in tests and API endpoints. This ensures consistency and makes it easier to manage test data scenarios.

## Components

### 1. MockDataManager (`tests/helpers/mock-manager.ts`)

The core singleton class that manages all mock data in memory:

- **Users**: Authentication and user role data
- **Events**: Conference/unconference event data  
- **Participants**: Event participant registrations
- **Assignments**: Participant topic/session assignments

#### Key Features

- **Singleton Pattern**: Ensures one consistent data source across all tests
- **CRUD Operations**: Create, read, update, delete for all data types
- **Snapshot Management**: Save and restore data state for test isolation
- **Statistics**: Calculate participant statistics automatically
- **Type Safety**: Full TypeScript support with proper interfaces

### 2. Mock Test Utils (`tests/helpers/mock-test-utils.ts`)

Extended Playwright test context that integrates the mock manager:

- **Extended Test Context**: Adds `mockData` fixture to all tests
- **Convenience Methods**: Simplified API for common operations
- **Test Scenarios**: Pre-built scenarios for common test setups
- **Auto Reset**: Automatically resets to defaults before each test

### 3. API Integration

All server API routes have been updated to use the centralized mock manager:

- `server/api/auth/login.post.ts` - User authentication
- `server/api/events/index.get.ts` - Event listing
- `server/api/events/[id]/index.get.ts` - Event details
- `server/api/events/[id]/participants.get.ts` - Participant data
- `server/api/events/[id]/assignments.get.ts` - Assignment data

## Usage

### Basic Test Setup

```typescript
import { test, expect } from './helpers/mock-test-utils'

test('my test', async ({ page, mockData }) => {
  // Mock data is automatically reset to defaults before each test
  
  // Access existing data
  const users = mockData.getTestUsers()
  const events = mockData.getTestEvents()
  
  // Add new data
  const newUser = mockData.addTestUser({
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User'
  })
})
```

### Using Pre-built Scenarios

```typescript
import { MockScenarios } from './helpers/mock-test-utils'

test('test with large event', async ({ page, mockData }) => {
  // Setup an event with 50 participants
  MockScenarios.setupLargeEvent(50)
  
  // Your test logic here
})

test('test with empty event', async ({ page, mockData }) => {
  // Setup a fresh event with no participants
  const { event } = MockScenarios.setupEmptyEvent()
  
  // Your test logic here
})
```

### Snapshot Management for Test Isolation

```typescript
test('test with data isolation', async ({ page, mockData }) => {
  // Create a snapshot of current state
  const snapshot = mockData.createTestSnapshot()
  
  // Modify data for this test
  mockData.addTestUser({ email: 'temp@example.com', firstname: 'Temp', lastname: 'User' })
  
  // Do your test logic
  
  // Restore original state
  mockData.restoreTestSnapshot(snapshot)
  
  // Data is back to original state
})
```

### Direct Mock Manager Access

```typescript
test('advanced mock operations', async ({ page, mockData }) => {
  // Access the raw mock manager for advanced operations
  const manager = mockData.manager
  
  // Update existing data
  manager.updateUser('luke@rebels.com', { role: 'User' })
  
  // Get statistics
  const stats = manager.getParticipantStats('1')
  
  // Filter data
  const assignments = manager.getAssignmentsByRound('1', 2)
})
```

## Available Mock Data Methods

### Users
- `getTestUsers()` - Get all users
- `addTestUser(userData)` - Add a new user
- `manager.getUserByEmail(email)` - Find user by email
- `manager.updateUser(email, updates)` - Update user data
- `manager.removeUser(email)` - Remove user

### Events
- `getTestEvents()` - Get all events  
- `addTestEvent(eventData)` - Add a new event
- `manager.getEventById(id)` - Find event by ID
- `manager.updateEvent(id, updates)` - Update event data
- `manager.removeEvent(id)` - Remove event

### Participants
- `getTestParticipants(eventId?)` - Get participants (all or by event)
- `addTestParticipant(participantData)` - Add a new participant
- `manager.getParticipantById(id)` - Find participant by ID
- `manager.getParticipantStats(eventId)` - Get participant statistics
- `manager.updateParticipant(id, updates)` - Update participant data
- `manager.removeParticipant(id)` - Remove participant

### Assignments
- `getTestAssignments(eventId?)` - Get assignments (all or by event)
- `addTestAssignment(assignmentData)` - Add a new assignment
- `manager.getAssignmentsByRound(eventId, round)` - Get assignments by round
- `manager.updateAssignment(id, updates)` - Update assignment data
- `manager.removeAssignment(id)` - Remove assignment

## Default Data

The system comes with sensible defaults:

### Users
- Luke Skywalker (`luke@rebels.com`) - Admin role
- Darth Vader (`darth@empire.com`) - Participant role

### Events  
- Universe User Group 2025 - Sample unconference event

### Participants
- 3 sample participants with different statuses

### Assignments
- 4 sample assignments across 2 rounds

## Best Practices

1. **Use `resetToDefaults()` in test setup** - Ensures consistent starting state
2. **Use snapshots for destructive tests** - Allows easy restoration
3. **Prefer convenience methods** - Use `addTestUser()` over direct manager access
4. **Use scenarios for common setups** - Reduces test boilerplate
5. **Keep tests isolated** - Each test should be independent

## Migration Guide

If you have existing tests that use hardcoded mock data:

### Before
```typescript
// Old approach with inline mock data
const mockUsers = [
  { email: 'test@example.com', firstname: 'Test', lastname: 'User' }
]
```

### After
```typescript
// New approach with centralized mock manager
test('my test', async ({ page, mockData }) => {
  const user = mockData.addTestUser({
    email: 'test@example.com', 
    firstname: 'Test', 
    lastname: 'User'
  })
})
```

## Troubleshooting

**Q: My test data isn't persisting between test runs**  
A: This is by design. The mock manager resets to defaults before each test for isolation.

**Q: I need custom data that persists across multiple tests**  
A: Use `test.beforeAll()` to set up data, or use snapshots to restore the same state.

**Q: The API isn't returning my test data**  
A: Make sure your API endpoints are using the mock manager instead of hardcoded data.

**Q: TypeScript errors with partial updates**  
A: The update methods preserve required fields automatically. Make sure you're not passing `undefined` for required fields.