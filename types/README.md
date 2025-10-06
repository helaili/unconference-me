# Type Definitions for Unconference Models

This directory contains TypeScript type definitions and Zod schemas for the core models of the unconference application.

## Models

### Event
Represents an unconference event with its configuration parameters.

**Key Fields:**
- `numberOfRounds`: Number of discussion rounds in the event
- `discussionsPerRound`: Number of parallel discussions in each round
- `idealGroupSize`: Target group size for discussions
- `minGroupSize`: Minimum allowed group size
- `maxGroupSize`: Maximum allowed group size
- `settings`: Optional event-level configuration for features like topic ranking and auto-assignment

**Usage:**
```typescript
import type { Event } from '~/types/event'
import { eventSchema } from '~/types/schemas'

// Create an event object
const event: Event = {
  id: '1',
  name: 'Eurocats 2025 Unconference',
  location: 'Paris La Defense',
  startDate: new Date('2025-05-21'),
  endDate: new Date('2025-05-22'),
  numberOfRounds: 6,
  discussionsPerRound: 10,
  idealGroupSize: 8,
  minGroupSize: 5,
  maxGroupSize: 12,
  status: 'published',
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    enableTopicRanking: true,
    enableAutoAssignment: true,
    maxTopicsPerParticipant: 3
  }
}

// Validate with Zod schema
const validated = eventSchema.parse(event)
```

### Topic
Represents a discussion topic proposed for an unconference event.

**Key Fields:**
- `proposedBy`: Participant ID who proposed the topic
- `status`: Current status (proposed, approved, scheduled, completed, rejected)
- `schedules`: Array of scheduling instances (optional). Popular topics can be scheduled in multiple rounds.

**TopicSchedule:**
- `roundNumber`: Which round this topic is scheduled for
- `groupNumber`: Which discussion group in the round

**Usage:**
```typescript
import type { Topic } from '~/types/topic'
import { topicSchema } from '~/types/schemas'

// Topic scheduled in a single round
const topic: Topic = {
  id: '1',
  eventId: '1',
  title: 'GitHub Copilot Best Practices',
  description: 'Discussion on how to effectively use GitHub Copilot',
  proposedBy: 'participant-123',
  status: 'scheduled',
  schedules: [
    { roundNumber: 1, groupNumber: 5 }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    tags: ['github', 'ai', 'productivity']
  }
}

// Popular topic scheduled in multiple rounds
const popularTopic: Topic = {
  id: '2',
  eventId: '1',
  title: 'AI and the Future of Development',
  description: 'Popular topic scheduled in multiple rounds',
  proposedBy: 'participant-456',
  status: 'scheduled',
  schedules: [
    { roundNumber: 1, groupNumber: 3 },
    { roundNumber: 3, groupNumber: 7 },
    { roundNumber: 5, groupNumber: 2 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Participant
Represents an attendee at an unconference event.

**Key Fields:**
- `userId`: Optional reference to User account
- `status`: Registration status (registered, confirmed, checked-in, cancelled)
- `preferences`: Optional participant preferences including topic rankings

**Usage:**
```typescript
import type { Participant } from '~/types/participant'
import { participantSchema } from '~/types/schemas'

const participant: Participant = {
  id: '1',
  eventId: '1',
  email: 'participant@example.com',
  firstname: 'John',
  lastname: 'Doe',
  status: 'confirmed',
  registrationDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  preferences: {
    topicRankings: {
      'topic-1': 1,
      'topic-2': 2,
      'topic-3': 3
    }
  }
}
```

### ParticipantAssignment
Represents a participant's assignment to a specific discussion.

**Usage:**
```typescript
import type { ParticipantAssignment } from '~/types/participant'
import { participantAssignmentSchema } from '~/types/schemas'

const assignment: ParticipantAssignment = {
  id: '1',
  participantId: 'participant-123',
  topicId: 'topic-456',
  eventId: '1',
  roundNumber: 1,
  groupNumber: 5,
  assignmentMethod: 'automatic',
  status: 'confirmed',
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Organizer
Represents a person with administrative permissions for an event.

**Key Fields:**
- `role`: Organizer role (owner, admin, moderator)
- `permissions`: Optional fine-grained permissions for event management

**Usage:**
```typescript
import type { Organizer } from '~/types/organizer'
import { organizerSchema } from '~/types/schemas'

const organizer: Organizer = {
  id: '1',
  eventId: '1',
  email: 'admin@example.com',
  firstname: 'Jane',
  lastname: 'Admin',
  role: 'admin',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  permissions: {
    canEditEvent: true,
    canApproveParticipants: true,
    canScheduleTopics: true,
    canManageAssignments: true
  }
}
```

## Validation with Zod

All models have corresponding Zod schemas in `schemas.ts` for runtime validation:

```typescript
import { eventSchema, topicSchema, participantSchema, organizerSchema } from '~/types/schemas'

// Validate data
try {
  const validatedEvent = eventSchema.parse(eventData)
} catch (error) {
  // Handle validation errors
  console.error(error)
}
```

## Future Extensibility

All models include optional metadata/settings/preferences fields to support future features:

- **Event.settings**: Configure topic ranking, auto-assignment, and other event-level features
- **Topic.metadata**: Store average rankings, interest counts, and tags
- **Participant.preferences**: Track topic rankings and preferred rounds
- **Organizer.permissions**: Fine-grained access control for different administrative tasks

## Import All Types

You can import all types from the central index file:

```typescript
import type { 
  Event, 
  Topic, 
  Participant, 
  ParticipantAssignment,
  Organizer 
} from '~/types'
```
