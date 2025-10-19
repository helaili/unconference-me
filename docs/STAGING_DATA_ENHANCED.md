# Enhanced Staging Database Data

## Overview

The staging database population script has been enhanced to generate comprehensive, realistic data for testing and development purposes. This document describes the data structure and quantities.

## Data Summary

### Users (151 total)
- **1 Admin** - Full system administration privileges
- **20 Organizers** - Event management capabilities with varying permission levels
- **130 Participants** - Standard event attendees

### Event Configuration
- **1 Main Event**: "Universe User Group 2025"
  - Location: Convene 100 Stockton, Union Square, San Francisco
  - Date: October 27, 2025
  - 3 rounds of discussions
  - 10 discussions per round
  - Group sizes: 5-12 participants (ideal: 8)
  - Max capacity: 150 participants
  - Topic ranking enabled
  - Auto-assignment enabled

### Organizers (20 total)

Organizers have differentiated roles and permissions:

1. **1 Owner** (organizer-1)
   - Full administrative access
   - Can delete events
   - All permissions enabled

2. **5 Admins** (organizer-2 through organizer-6)
   - Can edit events
   - Can run auto-assignment
   - Most permissions enabled

3. **14 Moderators** (organizer-7 through organizer-20)
   - Standard moderation capabilities
   - Can approve/reject topics
   - Can schedule topics
   - Limited administrative access

### Participants (130 total)

Participants are distributed across three status types:
- **~43 Registered** - Initial registration complete
- **~43 Confirmed** - Confirmed attendance
- **~44 Checked-in** - Physically present at event

All participants have:
- Unique email addresses (participant1@[company].com through participant130@[company].com)
- Varied registration dates (September 2024)
- Company affiliations from 15 different organizations

### Topics (30 total)

Topics cover modern software development themes:
- Proposed by 20 different participants
- Each proposer has submitted 1-2 topics
- All topics are in "approved" status
- Topics include:
  - Microservices Architecture Patterns
  - Kubernetes Best Practices
  - Serverless Computing at Scale
  - GraphQL vs REST APIs
  - Event-Driven Architecture
  - Domain-Driven Design
  - And 24 more diverse technical topics

### Topic Rankings (104 total)

Topic ranking statistics:
- **80% participation rate** (104 out of 130 participants)
- Each participant who ranked has selected **6 favorite topics**
- Rankings are in priority order (1st choice to 6th choice)
- Total ranking data points: **624 individual topic preferences**
- Ranking dates: October 2024

This provides excellent data for testing:
- Auto-assignment algorithms
- Topic popularity analysis
- Participant engagement metrics
- Schedule optimization

### Company Distribution

Participants and organizers are affiliated with 15 fictional companies:
- TechCorp
- InnoSoft
- DataSys
- CloudNet
- DevHub
- CodeLabs
- ByteWorks
- WebForge
- AppMasters
- SysGuru
- NetPro
- InfoTech
- DigiSoft
- SmartCode
- AgileOps

## Data Characteristics

### Realistic Distribution
- Participants distributed across multiple companies
- Varied registration dates to simulate real-world enrollment patterns
- Different status types (registered, confirmed, checked-in)
- Multiple organizer roles with appropriate permission sets

### Test-Friendly Features
- All users share the same test password: "changeme" (pre-hashed)
- Sequential IDs for easy reference (participant-1, topic-1, etc.)
- Predictable email patterns for automation
- Comprehensive ranking data for algorithm testing

### Volume Appropriate for Testing
- Enough participants (130) to test capacity planning
- Sufficient topics (30) for realistic unconference scenario
- High ranking participation (80%) for assignment testing
- Multiple organizer roles to test permission systems

## Usage

To populate the staging database with this enhanced data:

```bash
# Set environment variables
export COSMOS_DB_CONNECTION_STRING_STAGING="your-connection-string"
export COSMODB_DATABASE="unconference-me"

# Run the population script
npm run populate:staging
```

## Testing Scenarios Enabled

This data set supports testing:

1. **Topic Assignment**
   - Auto-assignment with 104 participants who have ranked 6 topics each
   - Manual assignment capabilities
   - Group size optimization (5-12 participants)

2. **Ranking Analysis**
   - Topic popularity metrics
   - Participant engagement tracking
   - Preference-based scheduling

3. **Capacity Management**
   - Near-capacity event (130/150 participants)
   - Multiple discussion rounds (3 rounds)
   - Concurrent sessions (10 per round)

4. **Organizer Permissions**
   - Role-based access control (owner, admin, moderator)
   - Permission inheritance testing
   - Multi-organizer workflows

5. **Participant Management**
   - Status transitions (registered → confirmed → checked-in)
   - Bulk operations on participants
   - Filtering and search across 130 records

6. **Topic Management**
   - Multiple topics from same proposers
   - Topic approval workflows
   - Topic popularity analytics

## Data Integrity

All generated data maintains referential integrity:
- All topics reference valid participant IDs as proposers
- All rankings reference valid participant and topic IDs
- All participants reference valid user emails
- All organizers reference valid event IDs

## Password Security

All users (admin, organizers, and participants) use the same pre-hashed password for testing:
- **Plain text**: "changeme"
- **Bcrypt hash**: `$2b$12$LGtR/rq3C67ODqfZiN.5Z.6JAuj4VBO7n8J4hWAtDbPLVD/hjkt5G`
- **Security**: Hash is pre-computed to avoid performance issues during population

⚠️ **Warning**: This is test data only. Never use these credentials in production!

## Future Enhancements

Potential additions for even more realistic data:
- Multiple events with different configurations
- Historical assignment data from past rounds
- Participant feedback and ratings
- Invitation and RSVP tracking
- Additional topic metadata (tags, categories)
- Organizer activity logs
