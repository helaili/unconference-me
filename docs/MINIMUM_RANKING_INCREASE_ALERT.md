# Minimum Ranking Requirement Increase Alert

## Overview

This feature alerts users when an event administrator increases the minimum number of topics that participants must rank. Users who have already submitted rankings with fewer topics than the new requirement will see a prominent warning message.

## Implementation

### 1. Data Model Changes

**File**: `types/topicRanking.ts`

Added a new field to the `TopicRanking` interface:
```typescript
minTopicsAtLastRanking?: number
```

This field stores the minimum number of topics required at the time the user last saved their ranking. This allows the system to detect when the requirement has increased.

### 2. API Changes

**File**: `server/api/events/[id]/rankings/index.post.ts`

When saving a ranking (both create and update), the API now:
1. Retrieves the current `minTopicsToRank` setting from the event
2. Stores this value in the `minTopicsAtLastRanking` field of the ranking

```typescript
const minTopicsToRank = eventData.settings?.minTopicsToRank || 3

// ... when creating or updating
{
  // ... other fields
  minTopicsAtLastRanking: minTopicsToRank
}
```

### 3. UI Changes

**File**: `components/TopicRanking.vue`

Added computed properties to detect when the minimum has increased:

```typescript
const minRankingIncreased = computed(() => {
  if (!props.ranking?.minTopicsAtLastRanking) return false
  return props.minRanking > props.ranking.minTopicsAtLastRanking
})

const currentRankedCount = computed(() => {
  if (!props.ranking?.rankedTopicIds) return 0
  return props.ranking.rankedTopicIds.length
})

const needsMoreRankings = computed(() => {
  return minRankingIncreased.value && currentRankedCount.value < props.minRanking
})
```

Added a prominent error alert that displays when `needsMoreRankings` is true:

```vue
<v-alert 
  v-if="needsMoreRankings"
  type="error"
  variant="tonal"
  class="mb-4"
  icon="mdi-alert-circle"
  prominent
>
  <strong>Action Required:</strong> The minimum number of topics to rank has increased from 
  {{ ranking?.minTopicsAtLastRanking }} to {{ minRanking }}.
  <span v-if="currentRankedCount < minRanking">
    You currently have {{ currentRankedCount }} topic(s) ranked, but you need to rank at least 
    {{ minRanking }} topics to meet the new requirement.
  </span>
  <span v-else>
    Please review and save your rankings to confirm they meet the new requirement.
  </span>
</v-alert>
```

## User Experience

### Scenario 1: User has not met new minimum

1. Admin sets event's `minTopicsToRank` from 3 to 6
2. User previously ranked only 3 topics (which met the old requirement)
3. User navigates to the ranking page
4. A **red error alert** appears at the top showing:
   - "Action Required: The minimum number of topics to rank has increased from 3 to 6"
   - "You currently have 3 topic(s) ranked, but you need to rank at least 6 topics to meet the new requirement"
5. The Save button remains disabled until the user has ranked at least 6 topics
6. Once the user ranks 6+ topics and saves, `minTopicsAtLastRanking` updates to 6

### Scenario 2: User already meets new minimum (but didn't save)

1. Admin sets event's `minTopicsToRank` from 3 to 6
2. User previously ranked 6 topics (exceeded the old requirement)
3. User navigates to the ranking page
4. A **red error alert** appears at the top showing:
   - "Action Required: The minimum number of topics to rank has increased from 3 to 6"
   - "Please review and save your rankings to confirm they meet the new requirement"
5. The Save button is enabled
6. User clicks Save to acknowledge the new requirement
7. `minTopicsAtLastRanking` updates to 6, and the alert won't show again

### Scenario 3: User has not ranked yet

1. Admin sets event's `minTopicsToRank` to 6
2. User has never ranked topics for this event
3. User navigates to the ranking page
4. **No alert** about increased minimum (since there was no previous ranking)
5. Standard instructions show that at least 6 topics must be ranked

### Scenario 4: Minimum decreased

1. Admin sets event's `minTopicsToRank` from 6 to 3
2. User previously ranked 6 topics
3. User navigates to the ranking page
4. **No alert** (decrease doesn't require user action)
5. User's existing ranking of 6 topics is still valid

## Testing

### Manual Testing Steps

1. **Setup**:
   - Create an event with `minTopicsToRank: 3`
   - Register as a participant
   - Create at least 6 approved topics
   - Rank exactly 3 topics and save

2. **Test Alert Appears**:
   - As admin, update the event's `minTopicsToRank` to 6
   - As participant, navigate to `/rankings/[eventId]`
   - Verify red error alert appears with correct message
   - Verify Save button is disabled

3. **Test Alert Content**:
   - Verify message shows "increased from 3 to 6"
   - Verify message shows "You currently have 3 topic(s) ranked"
   - Verify message shows "need to rank at least 6 topics"

4. **Test Ranking More Topics**:
   - Drag and drop more topics into ranking positions
   - Verify Save button becomes enabled when 6+ topics are ranked
   - Click Save
   - Verify success message appears

5. **Test Alert Disappears**:
   - Navigate away and return to `/rankings/[eventId]`
   - Verify alert no longer appears
   - Verify ranking shows all 6+ topics in saved order

### Database Verification

After saving a ranking, verify in the database (CosmosDB or mock data):
```javascript
{
  "id": "ranking-xxx",
  "participantId": "participant-xxx",
  "eventId": "event-xxx",
  "rankedTopicIds": ["topic-1", "topic-2", "topic-3", "topic-4", "topic-5", "topic-6"],
  "minTopicsAtLastRanking": 6,  // <-- This should match current event setting
  "lastRankedAt": "2025-10-18T...",
  "lastViewedAt": "2025-10-18T...",
  "createdAt": "2025-10-18T...",
  "updatedAt": "2025-10-18T..."
}
```

## Edge Cases

1. **User has no `minTopicsAtLastRanking` value** (old data):
   - Alert will not show (graceful degradation)
   - After next save, field will be populated

2. **Multiple increases**:
   - If admin increases from 3→6→8, user sees "increased from 3 to 8"
   - Alert persists until user saves with new requirement

3. **Concurrent changes**:
   - If user is ranking while admin changes requirement, they see the new requirement after page refresh
   - Their save will use the current requirement value

## Future Enhancements

1. **Email notifications**: Send email when requirement increases
2. **Dashboard badge**: Show notification badge on dashboard for affected users
3. **History tracking**: Store history of minimum requirement changes
4. **Bulk re-ranking**: Allow users to quickly add more topics to existing ranking
