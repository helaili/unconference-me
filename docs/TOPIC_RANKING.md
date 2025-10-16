# Topic Ranking Feature

## Overview

The Topic Ranking feature allows unconference participants to rank their preferred discussion topics in order of interest. This helps organizers understand participant preferences and can be used for automated or manual assignment to discussion groups.

## Features

### Core Functionality

1. **Drag-and-Drop Interface**
   - Participants can reorder topics by dragging them
   - Visual feedback during drag operations
   - Numbered rank indicators (1, 2, 3, etc.)

2. **Keyboard Navigation**
   - Full keyboard support for accessibility
   - Tab: Navigate between topics
   - Space/Enter: Select/deselect topic for reordering
   - Arrow Up/Down: Move selected topic
   - Button controls as alternative

3. **Minimum Ranking Requirement**
   - Configurable minimum number of topics to rank
   - Save button disabled until minimum met
   - Visual indicators for required rankings

4. **New Topic Highlighting**
   - Tracks when participant last viewed topics
   - Highlights topics created/updated since last view
   - "NEW" badge and yellow border for visual distinction

5. **Dashboard Integration**
   - Widget showing pending ranking tasks
   - Status indicators (complete, incomplete, new topics)
   - Direct links to ranking pages

## User Workflow

### For Participants

1. **Access Dashboard**
   - Log in to the application
   - View "Topic Ranking Tasks" widget on dashboard

2. **Navigate to Ranking Page**
   - Click "Rank" or "Update" button for an event
   - Alternative: Direct URL `/rankings/[eventId]`

3. **Rank Topics**
   - Drag topics to reorder (or use keyboard/buttons)
   - Ensure minimum number of topics ranked
   - New topics are highlighted with "NEW" badge

4. **Save Ranking**
   - Click "Save Ranking" button
   - Success message displays
   - Redirected to dashboard

5. **Update Ranking**
   - Return to ranking page any time
   - Existing order is preserved
   - New topics appear at bottom

### For Admins

Admins have the same ranking capabilities as participants. They can:
- Rank topics for any event (without being a registered participant)
- View all approved topics
- Same interface and workflow as regular participants

## Configuration

### Event Settings

Enable topic ranking in event settings:

```typescript
{
  settings: {
    enableTopicRanking: true,     // Enable/disable ranking
    minTopicsToRank: 3,            // Minimum topics to rank (default: 3)
    maxTopicsPerParticipant: 3     // Max topics user can propose
  }
}
```

### Access Control

- **Authentication Required**: All ranking operations require login
- **Participant Verification**: Users must be registered participants (or admins)
- **Topic Filtering**: Only approved topics or user's own proposals are visible

## Technical Architecture

### Data Model

#### TopicRanking

```typescript
interface TopicRanking {
  id: string                    // Unique ranking ID
  participantId: string         // Reference to participant
  eventId: string              // Reference to event
  rankedTopicIds: string[]     // Ordered list of topic IDs (highest priority first)
  lastViewedAt: Date           // When participant last viewed topics
  lastRankedAt?: Date          // When ranking was last saved
  createdAt: Date
  updatedAt: Date
}
```

#### EventSettings Extension

```typescript
interface EventSettings {
  enableTopicRanking?: boolean  // Enable ranking feature
  minTopicsToRank?: number      // Minimum topics to rank
  // ... other settings
}
```

### Service Layer

**TopicRankingService** (`services/topicRankingService.ts`)

Follows the hybrid service pattern:
- **Development/Testing**: Uses mock data via MockDataManager
- **Staging/Production**: Uses Azure CosmosDB

Key methods:
- `findByParticipantAndEvent(participantId, eventId)` - Get participant's ranking
- `findByEventId(eventId)` - Get all rankings for an event
- `create(rankingData)` - Create new ranking
- `update(id, updates)` - Update existing ranking
- `delete(id)` - Delete ranking

### API Endpoints

#### GET `/api/events/[id]/rankings`

Fetches the current user's ranking for an event.

**Response:**
```json
{
  "success": true,
  "ranking": {
    "id": "ranking-123",
    "participantId": "participant-456",
    "eventId": "1",
    "rankedTopicIds": ["topic-1", "topic-3", "topic-2"],
    "lastViewedAt": "2025-10-15T08:00:00Z",
    "lastRankedAt": "2025-10-15T08:05:00Z",
    "createdAt": "2025-10-14T10:00:00Z",
    "updatedAt": "2025-10-15T08:05:00Z"
  }
}
```

#### POST `/api/events/[id]/rankings`

Saves or updates the current user's ranking.

**Request Body:**
```json
{
  "rankedTopicIds": ["topic-2", "topic-1", "topic-3"]
}
```

**Response:**
```json
{
  "success": true,
  "ranking": { /* Updated ranking object */ }
}
```

#### POST `/api/events/[id]/rankings/view`

Updates the `lastViewedAt` timestamp to track new topics.

**Response:**
```json
{
  "success": true,
  "ranking": { /* Ranking with updated lastViewedAt */ }
}
```

### UI Components

#### TopicRanking.vue

Main ranking interface component.

**Props:**
- `topics` - Array of Topic objects
- `ranking` - Current TopicRanking or null
- `minRanking` - Minimum topics to rank (default: 3)
- `isAdmin` - Whether user is admin
- `participantId` - Current participant's ID

**Events:**
- `save` - Emitted with rankedTopicIds array when user saves

**Features:**
- Drag-and-drop reordering
- Keyboard navigation
- Visual indicators for new topics
- Minimum ranking enforcement
- Mobile-responsive design

#### RankingTasks.vue

Dashboard widget showing ranking tasks.

**Features:**
- Fetches all events with ranking enabled
- Shows ranking status for each event
- Displays count of new/updated topics
- Direct links to ranking pages

#### pages/rankings/[eventId].vue

Full page for ranking topics.

**Features:**
- Fetches event, topics, and participant data
- Filters topics (approved or user-proposed only)
- Embeds TopicRanking component
- Handles save and navigation
- Error handling and loading states

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between topics
- **Space/Enter**: Select/deselect topic for reordering
- **Arrow Up**: Move selected topic up
- **Arrow Down**: Move selected topic down
- **Escape**: Cancel selection

### Screen Reader Support

- ARIA labels on all interactive elements
- Role attributes for drag-and-drop items
- Status announcements for actions
- Descriptive button labels

### Visual Accessibility

- High contrast colors for all states
- Visible focus indicators
- Icon + text labels
- Minimum 44px touch targets
- Responsive font sizes

## Mobile Support

### Responsive Design

- Breakpoints using Vuetify display system
- Mobile-first approach
- Touch-friendly controls (44px+ targets)

### Mobile Features

- Touch drag-and-drop support
- Alternative button controls always visible
- Optimized spacing for small screens
- Works on viewports 320px and up

## Testing

### Test Suite

Located in `tests/topic-ranking.spec.ts`

**Test Coverage:**
1. Ranking tasks display on dashboard
2. Navigation to ranking page
3. Drag-and-drop interface rendering
4. Minimum ranking enforcement
5. Keyboard controls availability

### Manual Testing Checklist

- [ ] Can drag topics to reorder
- [ ] Keyboard navigation works
- [ ] Button controls work
- [ ] Minimum ranking enforced
- [ ] New topics are highlighted
- [ ] Dashboard widget shows status
- [ ] Save persists ranking
- [ ] Mobile layout responsive
- [ ] Screen reader accessible

## Future Enhancements

Potential improvements (not currently implemented):

1. **Analytics Dashboard**
   - View aggregated rankings across all participants
   - Identify most/least popular topics
   - Export data for reporting

2. **Automatic Assignment**
   - Use rankings to auto-assign participants to groups
   - Optimize for participant preferences
   - Balance group sizes

3. **Collaborative Features**
   - See how many others ranked a topic
   - View aggregate rankings
   - Topic discussions/comments

4. **Advanced Filtering**
   - Filter by topic tags
   - Search topics
   - Sort by various criteria

5. **Batch Operations**
   - Copy rankings between events
   - Bulk approve/reject topics
   - Template rankings

## Troubleshooting

### Common Issues

**Issue: Topics not appearing**
- Verify event has `enableTopicRanking: true`
- Check topics are approved or proposed by user
- Ensure user is registered participant

**Issue: Cannot save ranking**
- Verify minimum ranking requirement met
- Check network connectivity
- Review browser console for errors

**Issue: Dashboard not showing tasks**
- Verify events have ranking enabled
- Check user is participant in events
- Clear browser cache

**Issue: Drag-and-drop not working**
- Try keyboard or button controls as alternative
- Check browser supports HTML5 drag-and-drop
- Verify no JavaScript errors

## Maintenance

### Data Cleanup

Rankings can be deleted when:
- Event is completed or cancelled
- Participant withdraws from event
- Topic ranking is disabled

### Monitoring

Monitor these metrics:
- Ranking completion rate
- Average time to complete ranking
- Number of topics typically ranked
- New topic notification engagement

### Database Considerations

**CosmosDB:**
- Container: `topicRankings`
- Partition Key: `/eventId`
- Indexing: Automatic on all fields
- TTL: Not set (manual cleanup)

**Mock Data:**
- Stored in MockDataManager
- Reset on server restart
- Used for development/testing only

## Support

For issues or questions:
1. Check this documentation
2. Review test files for examples
3. Check repository issues on GitHub
4. Contact development team
