# Assignment Algorithm Improvements

## Overview

This document describes improvements made to the assignment algorithm to ensure proper filtering and unique topic assignments.

## Changes Made

### 1. **Admin and Organizer Exclusion**

The assignment algorithm now properly excludes administrators and organizers from automatic topic assignments.

#### Implementation Details

- **Modified `AssignmentInput` interface** to accept:
  - `users?: Map<string, { role?: 'Admin' | 'Organizer' | 'Participant' }>` - User role information
  - `organizerIds?: Set<string>` - Set of participant IDs who are organizers for the event

- **Enhanced participant filtering** in `generateAssignments()`:
  - Excludes participants whose `userId` links to a User with role 'Admin'
  - Excludes participants whose `userId` links to a User with role 'Organizer'
  - Excludes participants who are listed in the Organizers table for the event

- **Updated API endpoint** (`/server/api/events/[id]/assignments/generate.post.ts`):
  - Fetches user information for all participants
  - Fetches organizers for the event
  - Passes this information to the assignment algorithm

### 2. **Approved Topics Only**

The algorithm already filtered for approved topics, but this behavior is now explicitly documented and tested.

- Only topics with `status === 'approved'` are considered for assignments
- Topics with status 'proposed', 'rejected', 'scheduled', or 'completed' are excluded

### 3. **Unique Topic Assignments**

Fixed the algorithm to ensure each participant is assigned to different topics across all rounds.

#### Implementation Details

- **Removed fallback logic** that allowed topic repeats
- **Enhanced tracking** in `assignRound()`:
  - The `participantAssignments` map tracks which topics each participant has been assigned to
  - Both the preference-based pass and the fill-in pass check this map before assigning
  - Each participant can only be assigned to a given topic once across all rounds

- **Improved warning messages**:
  - Distinguishes between "already assigned to all available topics" and "all groups are full"
  - Provides more actionable feedback for troubleshooting

## Algorithm Flow

### High-Level Process

1. **Filter participants**:
   - Include only active participants (registered, confirmed, or checked-in)
   - Exclude admins (based on User role)
   - Exclude organizers (based on User role or Organizer table)

2. **Filter topics**:
   - Include only approved topics

3. **For each round**:
   - Select topics for the round based on popularity
   - Create groups for each topic
   - **First pass**: Assign participants based on their ranked preferences
     - Skip topics they've already been assigned to in previous rounds
     - Respect maxGroupSize constraint
   - **Second pass**: Fill remaining spots
     - Assign unassigned participants to smallest groups
     - Skip topics they've already been assigned to
   - Balance group sizes to approach idealGroupSize
   - Create assignment records and track assignments

4. **Calculate statistics** including assignment distribution

## Testing

### New Test Suite

Created `tests/assignment-filtering.spec.ts` with comprehensive unit tests:

1. **Admin Exclusion Test**
   - Verifies that participants with Admin role are not assigned
   - Confirms regular participants receive assignments

2. **Organizer Exclusion Test**
   - Verifies that participants listed as organizers are not assigned
   - Confirms participants with Organizer role are not assigned
   - Confirms regular participants receive assignments

3. **Topic Uniqueness Test**
   - Verifies each participant is assigned to different topics across all rounds
   - Confirms no duplicate topic assignments for any participant

4. **Approved Topics Only Test**
   - Verifies only approved topics are used in assignments
   - Confirms proposed and rejected topics are never assigned

### Test Results

All tests pass successfully:
```
Running 4 tests using 4 workers
  4 passed (545ms)
```

## API Changes

### Modified Endpoint

`POST /api/events/[id]/assignments/generate`

Now fetches additional data:
- User information for participants (to check roles)
- Organizer information for the event

These are passed to the assignment algorithm for proper filtering.

## Example Scenarios

### Scenario 1: Mixed Participant Types

**Setup**:
- 1 Admin participant
- 1 Organizer participant  
- 3 Regular participants
- 2 rounds, 2 discussions per round

**Result**:
- Admin and Organizer: 0 assignments
- Regular participants: 2 assignments each (1 per round, all to different topics)

### Scenario 2: Limited Topics

**Setup**:
- 3 Participants
- 3 Rounds
- 2 Discussions per round
- 6 Approved topics

**Result**:
- Each participant gets 3 assignments (1 per round)
- All assignments are to different topics
- No participant attends the same topic twice

## Error Handling

The algorithm now provides clearer error messages:

- `"Cannot generate assignments: no active participants (after filtering admins and organizers)"` - When all participants are admins/organizers
- `"Round X: Participant Y already assigned to all N available topics"` - When a participant has been assigned to all topics already
- `"Round X: Unable to assign participant Y - all groups are full"` - When groups are at capacity

## Backward Compatibility

The changes are backward compatible:
- The `users` and `organizerIds` parameters are optional
- If not provided, the algorithm behaves as before (no role-based filtering)
- Existing API calls will continue to work, but should be updated to provide the filtering data

## Future Improvements

Potential enhancements for consideration:

1. **Preference Weighting**: Give higher weight to participants who have ranked fewer topics
2. **Group Diversity**: Try to balance groups by organization or other criteria
3. **Topic Repetition Strategy**: When there are more rounds than topics, implement a fair strategy for repeating topics
4. **Organizer Opt-in**: Allow organizers to optionally participate if they choose

## Related Files

- `server/services/assignmentAlgorithmService.ts` - Core algorithm
- `server/api/events/[id]/assignments/generate.post.ts` - API endpoint
- `tests/assignment-filtering.spec.ts` - Test suite
- `types/participant.ts` - Participant interface
- `types/user.ts` - User interface with roles
- `types/organizer.ts` - Organizer interface
