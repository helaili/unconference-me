import type { User } from '../../types/user'
import type { Event } from '../../types/event'
import type { Participant, ParticipantAssignment } from '../../types/participant'
import type { Topic } from '../../types/topic'
import type { Invitation } from '../../types/invitation'
import type { TopicRanking } from '../../types/topicRanking'
import type { Organizer } from '../../types/organizer'

/**
 * Centralized Mock Data Manager
 * 
 * This service provides a single source of truth for all mock data used across the application.
 * It maintains in-memory state that can be reset, modified, and queried consistently
 * across tests and API endpoints.
 */
export class MockDataManager {
  private static instance: MockDataManager
  private _users: User[] = []
  private _events: Event[] = []
  private _participants: Participant[] = []
  private _assignments: ParticipantAssignment[] = []
  private _topics: Topic[] = []
  private _invitations: Invitation[] = []
  private _topicRankings: TopicRanking[] = []
  private _organizers: Organizer[] = []

  private constructor() {
    this.resetToDefaults()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager()
    }
    return MockDataManager.instance
  }

  /**
   * Reset all data to default state
   */
  resetToDefaults(): void {
    this._users = this.getDefaultUsers()
    this._events = this.getDefaultEvents()
    this._participants = this.getDefaultParticipants()
    this._assignments = this.getDefaultAssignments()
    this._topics = this.getDefaultTopics()
    this._invitations = this.getDefaultInvitations()
    this._topicRankings = this.getDefaultTopicRankings()
    this._organizers = this.getDefaultOrganizers()
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this._users = []
    this._events = []
    this._participants = []
    this._assignments = []
    this._topics = []
    this._invitations = []
    this._topicRankings = []
    this._organizers = []
  }

  // ==================== USERS ====================

  private getDefaultUsers(): User[] {
    // Pre-hashed version of "changeme" using bcrypt
    // This allows tests to run synchronously while still using secure hashed passwords
    const hashedPassword = '$2b$12$LGtR/rq3C67ODqfZiN.5Z.6JAuj4VBO7n8J4hWAtDbPLVD/hjkt5G' // "changeme"
    
    const users: User[] = [
      {
        id: "luke@rebels.com",
        firstname: "Luke",
        lastname: "Skywalker",
        email: "luke@rebels.com",
        password: hashedPassword,
        role: "Admin",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: "darth@empire.com",
        firstname: "Darth",
        lastname: "Vader",
        email: "darth@empire.com",
        password: hashedPassword,
        role: "Participant",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: "organizer@example.com",
        firstname: "Jane",
        lastname: "Organizer",
        email: "organizer@example.com",
        password: hashedPassword,
        role: "Organizer",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: "unregistered@example.com",
        firstname: "Unregistered",
        lastname: "User",
        email: "unregistered@example.com",
        password: hashedPassword,
        role: "Participant",
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]

    // Generate 145 additional users (to reach ~150 total, accounting for 130 participants + 15 organizers with some overlap)
    const firstNames = [
      'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
      'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
      'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery', 'Sebastian',
      'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe', 'Samuel', 'Victoria', 'David',
      'Madison', 'Joseph', 'Luna', 'Carter', 'Penelope', 'Wyatt', 'Layla', 'John', 'Riley', 'Dylan'
    ]
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ]

    for (let i = 5; i <= 149; i++) {
      const firstName = firstNames[i % firstNames.length]!
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]!
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@github.com`
      
      // First 15 additional users are organizers, rest are participants
      const role = i <= 19 ? 'Organizer' : 'Participant'
      
      users.push({
        id: email,
        firstname: firstName,
        lastname: lastName,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })
    }

    return users
  }

  getUsers(): User[] {
    return [...this._users]
  }

  getUserByEmail(email: string): User | undefined {
    return this._users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  addUser(user: User): void {
    this._users.push(user)
  }

  updateUser(email: string, updates: Partial<User>): boolean {
    const index = this._users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
    if (index === -1) return false
    
    // Ensure required fields are preserved
    const currentUser = this._users[index]!
    this._users[index] = {
      ...currentUser,
      ...updates,
      id: updates.email ?? currentUser.email, // ID follows email
      email: updates.email ?? currentUser.email,
      updatedAt: new Date()
    }
    return true
  }

  removeUser(email: string): boolean {
    const index = this._users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
    if (index === -1) return false
    this._users.splice(index, 1)
    return true
  }

  // ==================== EVENTS ====================

  private getDefaultEvents(): Event[] {
    return [
      {
        id: '1',
        name: 'Universe User Group 2025',
        description: 'Annual unconference event for Universe users',
        location: 'Convene 100 Stockton, Union Square, San Francisco',
        startDate: new Date('2025-10-27T09:00:00Z'),
        endDate: new Date('2025-10-27T17:00:00Z'),
        numberOfRounds: 3,
        discussionsPerRound: 5,
        idealGroupSize: 8,
        minGroupSize: 5,
        maxGroupSize: 10,
        status: 'active',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
        settings: {
          enableTopicRanking: true,
          minTopicsToRank: 6,
          enableAutoAssignment: false,
          maxTopicsPerParticipant: 3,
          requireApproval: false,
          maxParticipants: 150
        }
      },
      {
        id: '2',
        name: 'Galaxy Meetup 2025',
        description: 'Another unconference event',
        location: 'Remote',
        startDate: new Date('2025-11-15T10:00:00Z'),
        endDate: new Date('2025-11-15T16:00:00Z'),
        numberOfRounds: 2,
        discussionsPerRound: 4,
        idealGroupSize: 6,
        minGroupSize: 4,
        maxGroupSize: 8,
        status: 'published',
        createdAt: new Date('2025-01-15T00:00:00Z'),
        updatedAt: new Date('2025-10-15T00:00:00Z'),
        settings: {
          enableTopicRanking: false,
          minTopicsToRank: 0,
          enableAutoAssignment: true,
          maxTopicsPerParticipant: 2,
          requireApproval: true,
          maxParticipants: 50
        }
      }
    ]
  }

  getEvents(): Event[] {
    return [...this._events]
  }

  getEventById(id: string): Event | undefined {
    return this._events.find(e => e.id === id)
  }

  addEvent(event: Event): void {
    this._events.push(event)
  }

  setEvents(events: Event[]): void {
    this._events = [...events]
  }

  updateEvent(id: string, updates: Partial<Event>): boolean {
    const index = this._events.findIndex(e => e.id === id)
    if (index === -1) return false
    
    // Ensure required fields are preserved  
    const currentEvent = this._events[index]!
    this._events[index] = {
      ...currentEvent,
      ...updates,
      id: updates.id ?? currentEvent.id,
      name: updates.name ?? currentEvent.name,
      updatedAt: new Date()
    }
    return true
  }

  removeEvent(id: string): boolean {
    const index = this._events.findIndex(e => e.id === id)
    if (index === -1) return false
    this._events.splice(index, 1)
    return true
  }

  // ==================== PARTICIPANTS ====================

  private getDefaultParticipants(): Participant[] {
    const participants: Participant[] = [
      {
        id: 'participant-luke',
        eventId: '1',
        userId: 'luke@rebels.com',
        email: 'luke@rebels.com',
        firstname: 'Luke',
        lastname: 'Skywalker',
        status: 'registered',
        registrationDate: new Date('2025-08-01T00:00:00Z'),
        createdAt: new Date('2025-08-01T00:00:00Z'),
        updatedAt: new Date('2025-08-01T00:00:00Z')
      },
      {
        id: 'participant-darth',
        eventId: '1',
        userId: 'darth@empire.com',
        email: 'darth@empire.com',
        firstname: 'Darth',
        lastname: 'Vader',
        status: 'registered',
        registrationDate: new Date('2025-09-06T00:00:00Z'),
        createdAt: new Date('2025-09-06T00:00:00Z'),
        updatedAt: new Date('2025-09-06T00:00:00Z')
      }
    ]

    const statuses: Array<'registered' | 'confirmed' | 'checked-in'> = ['registered', 'confirmed', 'checked-in']
    
    // Generate 128 more participants for event '1' (total 130)
    // Using users 20-147 (128 users)
    for (let i = 20; i <= 147; i++) {
      const userEmail = this.getDefaultUsers()[i]?.email
      if (!userEmail) continue
      
      const user = this.getDefaultUsers()[i]!
      const status = statuses[i % 3]!
      const daysAgo = Math.floor((i - 20) / 3) // Spread registrations over ~42 days
      
      participants.push({
        id: `participant-${i}`,
        eventId: '1',
        userId: userEmail,
        email: userEmail,
        firstname: user.firstname,
        lastname: user.lastname,
        status,
        registrationDate: new Date(Date.UTC(2025, 8, 1) - daysAgo * 24 * 60 * 60 * 1000), // Starting from Sept 1
        createdAt: new Date(Date.UTC(2025, 8, 1) - daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.UTC(2025, 8, 1) - daysAgo * 24 * 60 * 60 * 1000)
      })
    }

    return participants
  }

  getParticipants(): Participant[] {
    return [...this._participants]
  }

  getParticipantsByEventId(eventId: string): Participant[] {
    return this._participants.filter(p => p.eventId === eventId)
  }

  getParticipantById(id: string): Participant | undefined {
    return this._participants.find(p => p.id === id)
  }

  addParticipant(participant: Participant): void {
    this._participants.push(participant)
  }

  updateParticipant(id: string, updates: Partial<Participant>): boolean {
    const index = this._participants.findIndex(p => p.id === id)
    if (index === -1) return false
    
    // Ensure required fields are preserved
    const currentParticipant = this._participants[index]!
    this._participants[index] = {
      ...currentParticipant,
      ...updates,
      id: updates.id ?? currentParticipant.id,
      eventId: updates.eventId ?? currentParticipant.eventId,
      email: updates.email ?? currentParticipant.email,
      firstname: updates.firstname ?? currentParticipant.firstname,
      lastname: updates.lastname ?? currentParticipant.lastname,
      updatedAt: new Date()
    }
    return true
  }

  removeParticipant(id: string): boolean {
    const index = this._participants.findIndex(p => p.id === id)
    if (index === -1) return false
    this._participants.splice(index, 1)
    return true
  }

  getParticipantStats(eventId: string) {
    const participants = this.getParticipantsByEventId(eventId)
    return {
      total: participants.length,
      registered: participants.filter(p => p.status === 'registered').length,
      confirmed: participants.filter(p => p.status === 'confirmed').length,
      checkedIn: participants.filter(p => p.status === 'checked-in').length,
      cancelled: participants.filter(p => p.status === 'cancelled').length
    }
  }

  // ==================== ASSIGNMENTS ====================

  private getDefaultAssignments(): ParticipantAssignment[] {
    return [
      {
        id: 'assignment-1',
        participantId: 'participant-1',
        topicId: 'topic-1',
        eventId: '1',
        roundNumber: 1,
        groupNumber: 1,
        assignmentMethod: 'manual',
        status: 'confirmed',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z')
      },
      {
        id: 'assignment-2',
        participantId: 'participant-2',
        topicId: 'topic-1',
        eventId: '1',
        roundNumber: 1,
        groupNumber: 1,
        assignmentMethod: 'automatic',
        status: 'assigned',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z')
      },
      {
        id: 'assignment-3',
        participantId: 'participant-3',
        topicId: 'topic-2',
        eventId: '1',
        roundNumber: 1,
        groupNumber: 2,
        assignmentMethod: 'automatic',
        status: 'assigned',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z')
      },
      {
        id: 'assignment-4',
        participantId: 'participant-1',
        topicId: 'topic-3',
        eventId: '1',
        roundNumber: 2,
        groupNumber: 1,
        assignmentMethod: 'manual',
        status: 'confirmed',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z')
      }
    ]
  }

  getAssignments(): ParticipantAssignment[] {
    return [...this._assignments]
  }

  getAssignmentsByEventId(eventId: string): ParticipantAssignment[] {
    return this._assignments.filter(a => a.eventId === eventId)
  }

  getAssignmentsByRound(eventId: string, roundNumber: number): ParticipantAssignment[] {
    return this._assignments.filter(a => a.eventId === eventId && a.roundNumber === roundNumber)
  }

  getAssignmentById(id: string): ParticipantAssignment | undefined {
    return this._assignments.find(a => a.id === id)
  }

  addAssignment(assignment: ParticipantAssignment): void {
    this._assignments.push(assignment)
  }

  updateAssignment(id: string, updates: Partial<ParticipantAssignment>): boolean {
    const index = this._assignments.findIndex(a => a.id === id)
    if (index === -1) return false
    
    // Ensure required fields are preserved
    const currentAssignment = this._assignments[index]!
    this._assignments[index] = {
      ...currentAssignment,
      ...updates,
      id: updates.id ?? currentAssignment.id,
      participantId: updates.participantId ?? currentAssignment.participantId,
      eventId: updates.eventId ?? currentAssignment.eventId,
      updatedAt: new Date()
    }
    return true
  }

  removeAssignment(id: string): boolean {
    const index = this._assignments.findIndex(a => a.id === id)
    if (index === -1) return false
    this._assignments.splice(index, 1)
    return true
  }

  // ==================== TOPICS ====================

  private getDefaultTopics(): Topic[] {
    // 40 GitHub-related topics covering Actions, Copilot, Advanced Security, 
    // enterprise management, developer experience, productivity, project management
    const topicData = [
      { title: 'GitHub Copilot Best Practices', description: 'Share tips and tricks for getting the most out of GitHub Copilot in daily development', tags: ['copilot', 'ai', 'productivity'] },
      { title: 'Advanced GitHub Actions Workflows', description: 'Complex workflow patterns, reusable workflows, and CI/CD optimization strategies', tags: ['actions', 'ci-cd', 'automation'] },
      { title: 'Code Security with GitHub Advanced Security', description: 'Leveraging CodeQL, secret scanning, and dependency review for secure code', tags: ['security', 'codeql', 'advanced-security'] },
      { title: 'GitHub Enterprise Management at Scale', description: 'Managing large GitHub Enterprise deployments, policies, and user access', tags: ['enterprise', 'management', 'scale'] },
      { title: 'Improving Developer Experience with GitHub', description: 'Tools, workflows, and practices that enhance developer productivity and satisfaction', tags: ['developer-experience', 'productivity'] },
      { title: 'GitHub Projects for Agile Teams', description: 'Using GitHub Projects for sprint planning, backlog management, and team collaboration', tags: ['project-management', 'agile', 'planning'] },
      { title: 'Copilot Chat: AI-Powered Code Reviews', description: 'Using Copilot Chat to improve code quality and perform intelligent code reviews', tags: ['copilot', 'code-review', 'ai'] },
      { title: 'GitHub Actions Matrix Strategies', description: 'Running tests across multiple environments, OS versions, and configurations', tags: ['actions', 'testing', 'ci-cd'] },
      { title: 'Secret Detection and Remediation', description: 'Preventing secrets in code and responding to secret scanning alerts', tags: ['security', 'secrets', 'advanced-security'] },
      { title: 'GitHub Enterprise Cloud vs Server', description: 'Comparing deployment options and migration strategies for enterprise teams', tags: ['enterprise', 'cloud', 'server'] },
      { title: 'Inner Source with GitHub', description: 'Building an inner source culture using GitHub collaboration features', tags: ['developer-experience', 'collaboration', 'culture'] },
      { title: 'Automating Project Workflows', description: 'GitHub Actions + Projects automation for streamlined project management', tags: ['project-management', 'actions', 'automation'] },
      { title: 'Copilot for Documentation', description: 'Using AI to generate, improve, and maintain technical documentation', tags: ['copilot', 'documentation', 'productivity'] },
      { title: 'Deployment Protection Rules', description: 'Controlling deployments with required reviewers and wait timers', tags: ['actions', 'deployment', 'security'] },
      { title: 'Dependency Review and Updates', description: 'Managing dependencies with Dependabot and dependency review', tags: ['security', 'dependencies', 'advanced-security'] },
      { title: 'GitHub Enterprise Audit Logs', description: 'Monitoring and analyzing enterprise activity for compliance and security', tags: ['enterprise', 'audit', 'compliance'] },
      { title: 'Custom GitHub Actions Development', description: 'Creating reusable GitHub Actions using JavaScript, Docker, or composite actions', tags: ['actions', 'development', 'automation'] },
      { title: 'Measuring Developer Productivity', description: 'Metrics, insights, and analytics for understanding developer effectiveness', tags: ['productivity', 'metrics', 'developer-experience'] },
      { title: 'Issue Templates and Forms', description: 'Standardizing issue creation with templates and structured forms', tags: ['project-management', 'issues', 'templates'] },
      { title: 'Copilot Workspace Deep Dive', description: 'Exploring Copilot Workspace for end-to-end development workflows', tags: ['copilot', 'workspace', 'productivity'] },
      { title: 'GitHub Actions Self-Hosted Runners', description: 'Deploying, scaling, and securing self-hosted runner infrastructure', tags: ['actions', 'runners', 'infrastructure'] },
      { title: 'Code Scanning with Custom Queries', description: 'Writing custom CodeQL queries for organization-specific security rules', tags: ['security', 'codeql', 'advanced-security'] },
      { title: 'GitHub Enterprise SAML and SSO', description: 'Configuring authentication and authorization for enterprise users', tags: ['enterprise', 'authentication', 'security'] },
      { title: 'Pull Request Best Practices', description: 'Creating effective PRs, review processes, and merge strategies', tags: ['developer-experience', 'code-review', 'collaboration'] },
      { title: 'GitHub Roadmaps and Planning', description: 'Long-term planning with GitHub Projects roadmaps and milestones', tags: ['project-management', 'planning', 'roadmap'] },
      { title: 'Copilot Training and Adoption', description: 'Strategies for rolling out Copilot across development teams', tags: ['copilot', 'training', 'adoption'] },
      { title: 'Continuous Deployment Strategies', description: 'Blue-green, canary, and progressive deployment patterns with Actions', tags: ['actions', 'deployment', 'ci-cd'] },
      { title: 'Security Advisories and CVEs', description: 'Managing security vulnerabilities and coordinating disclosures', tags: ['security', 'vulnerabilities', 'advanced-security'] },
      { title: 'GitHub Enterprise Backup and DR', description: 'Disaster recovery planning and backup strategies for GitHub Enterprise', tags: ['enterprise', 'backup', 'disaster-recovery'] },
      { title: 'Monorepo Management with GitHub', description: 'Strategies for managing large monorepos, code ownership, and CODEOWNERS', tags: ['developer-experience', 'monorepo', 'management'] },
      { title: 'Team Sync and Retrospectives', description: 'Using GitHub Discussions and Projects for team communication', tags: ['project-management', 'team', 'communication'] },
      { title: 'Copilot for Testing', description: 'Generating unit tests, integration tests, and test fixtures with AI', tags: ['copilot', 'testing', 'productivity'] },
      { title: 'GitHub Actions Caching Strategies', description: 'Optimizing workflow performance with effective caching', tags: ['actions', 'performance', 'optimization'] },
      { title: 'Supply Chain Security', description: 'Securing the software supply chain with dependency graphs and SBOM', tags: ['security', 'supply-chain', 'advanced-security'] },
      { title: 'Enterprise Migration Planning', description: 'Migrating to GitHub Enterprise from other platforms', tags: ['enterprise', 'migration', 'planning'] },
      { title: 'Developer Onboarding Programs', description: 'Creating effective onboarding experiences for new developers', tags: ['developer-experience', 'onboarding', 'training'] },
      { title: 'Automated Release Management', description: 'Release automation, changelog generation, and semantic versioning', tags: ['project-management', 'releases', 'automation'] },
      { title: 'GitHub Copilot vs Other AI Tools', description: 'Comparing GitHub Copilot with alternative AI coding assistants', tags: ['copilot', 'ai', 'comparison'] },
      { title: 'Multi-Platform Mobile CI/CD', description: 'Building iOS and Android apps with GitHub Actions', tags: ['actions', 'mobile', 'ci-cd'] },
      { title: 'Zero Trust Security Architecture', description: 'Implementing zero trust principles in GitHub workflows and deployments', tags: ['security', 'zero-trust', 'architecture'] }
    ]

    const topics: Topic[] = []
    const participants = this.getDefaultParticipants()
    
    // Distribute topics among participants (some participants propose multiple topics)
    for (let i = 0; i < 40; i++) {
      const topicInfo = topicData[i]!
      // Use participants 20-60 as proposers (first 40 participants after luke and darth)
      const proposerIndex = 20 + (i % 40)
      const proposerId = `participant-${proposerIndex}`
      
      const daysAgo = Math.floor(i / 2) // Topics proposed over ~20 days
      const createdDate = new Date(Date.UTC(2025, 8, 5) - daysAgo * 24 * 60 * 60 * 1000)
      
      topics.push({
        id: `topic-${i + 1}`,
        eventId: '1',
        title: topicInfo.title,
        description: topicInfo.description,
        proposedBy: proposerId,
        status: 'approved',
        createdAt: createdDate,
        updatedAt: createdDate,
        metadata: {
          tags: topicInfo.tags
        }
      })
    }

    return topics
  }

  getTopics(): Topic[] {
    return [...this._topics]
  }

  getTopicsByEventId(eventId: string): Topic[] {
    return this._topics.filter(t => t.eventId === eventId)
  }

  getTopicsByProposer(proposedBy: string): Topic[] {
    return this._topics.filter(t => t.proposedBy === proposedBy)
  }

  getTopicById(id: string): Topic | undefined {
    return this._topics.find(t => t.id === id)
  }

  addTopic(topic: Topic): void {
    this._topics.push(topic)
  }

  updateTopic(id: string, updates: Partial<Topic>): boolean {
    const index = this._topics.findIndex(t => t.id === id)
    if (index === -1) return false
    
    const currentTopic = this._topics[index]
    if (!currentTopic) return false
    
    // Ensure required fields are preserved
    this._topics[index] = {
      ...currentTopic,
      ...updates,
      id: updates.id ?? currentTopic.id,
      eventId: updates.eventId ?? currentTopic.eventId,
      title: updates.title ?? currentTopic.title,
      proposedBy: updates.proposedBy ?? currentTopic.proposedBy,
      updatedAt: new Date()
    }
    return true
  }

  removeTopic(id: string): boolean {
    const index = this._topics.findIndex(t => t.id === id)
    if (index === -1) return false
    this._topics.splice(index, 1)
    return true
  }

  /**
   * Soft delete a topic by marking it as rejected
   */
  softDeleteTopic(id: string): boolean {
    return this.updateTopic(id, { status: 'rejected' })
  }

  /**
   * Count topics by proposer for a specific event
   */
  countTopicsByProposer(eventId: string, proposedBy: string): number {
    return this._topics.filter(
      t => t.eventId === eventId && 
           t.proposedBy === proposedBy && 
           t.status !== 'rejected'
    ).length
  }

  // ==================== INVITATIONS ====================

  private getDefaultInvitations(): Invitation[] {
    return []
  }

  getInvitations(): Invitation[] {
    return [...this._invitations]
  }

  getInvitationById(id: string): Invitation | undefined {
    return this._invitations.find(i => i.id === id)
  }

  getInvitationsByEventId(eventId: string): Invitation[] {
    return this._invitations.filter(i => i.eventId === eventId)
  }

  getInvitationsByUserId(userId: string): Invitation[] {
    return this._invitations.filter(i => i.userId === userId)
  }

  getPendingInvitationsByUserId(userId: string): Invitation[] {
    return this._invitations.filter(i => i.userId === userId && i.status === 'pending')
  }

  addInvitation(invitation: Invitation): void {
    this._invitations.push(invitation)
  }

  updateInvitation(id: string, updates: Partial<Invitation>): boolean {
    const index = this._invitations.findIndex(i => i.id === id)
    if (index === -1) return false
    
    this._invitations[index] = {
      ...this._invitations[index]!,
      ...updates,
      updatedAt: new Date()
    }
    return true
  }

  removeInvitation(id: string): boolean {
    const index = this._invitations.findIndex(i => i.id === id)
    if (index === -1) return false
    
    this._invitations.splice(index, 1)
    return true
  }

  // ==================== ORGANIZERS ====================

  private getDefaultOrganizers(): Organizer[] {
    const organizers: Organizer[] = []
    const users = this.getDefaultUsers()
    
    // Create 15 organizers for event '1'
    // Use the organizer users (indices 2, 5-19)
    const organizerUserIndices = [2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    
    for (let i = 0; i < 15; i++) {
      const userIndex = organizerUserIndices[i]!
      const user = users[userIndex]!
      const isOwner = i === 0 // First organizer is the owner
      const isAdmin = i > 0 && i <= 5 // First 5 non-owner organizers are admins
      
      organizers.push({
        id: `organizer-${i + 1}`,
        eventId: '1',
        userId: user.email,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: isOwner ? 'owner' : (isAdmin ? 'admin' : 'moderator'),
        status: 'active',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        permissions: {
          canEditEvent: isOwner || isAdmin,
          canDeleteEvent: isOwner,
          canApproveParticipants: true,
          canRemoveParticipants: isOwner || isAdmin,
          canApproveTopics: true,
          canRejectTopics: true,
          canScheduleTopics: true,
          canManageAssignments: true,
          canRunAutoAssignment: isOwner || isAdmin,
          canViewReports: true,
          canExportData: isOwner || isAdmin
        }
      })
    }

    return organizers
  }

  getOrganizers(): Organizer[] {
    return [...this._organizers]
  }

  getOrganizerById(id: string): Organizer | undefined {
    return this._organizers.find(o => o.id === id)
  }

  getOrganizersByEventId(eventId: string): Organizer[] {
    return this._organizers.filter(o => o.eventId === eventId)
  }

  getOrganizersByUserId(userId: string): Organizer[] {
    return this._organizers.filter(o => o.userId === userId)
  }

  addOrganizer(organizer: Organizer): void {
    this._organizers.push(organizer)
  }

  updateOrganizer(id: string, updates: Partial<Organizer>): boolean {
    const index = this._organizers.findIndex(o => o.id === id)
    if (index === -1) return false
    
    const currentOrganizer = this._organizers[index]
    if (!currentOrganizer) return false
    
    // Ensure required fields are preserved
    this._organizers[index] = {
      ...currentOrganizer,
      ...updates,
      id: updates.id ?? currentOrganizer.id,
      eventId: updates.eventId ?? currentOrganizer.eventId,
      email: updates.email ?? currentOrganizer.email,
      firstname: updates.firstname ?? currentOrganizer.firstname,
      lastname: updates.lastname ?? currentOrganizer.lastname,
      role: updates.role ?? currentOrganizer.role,
      updatedAt: new Date()
    }
    return true
  }

  removeOrganizer(id: string): boolean {
    const index = this._organizers.findIndex(o => o.id === id)
    if (index === -1) return false
    this._organizers.splice(index, 1)
    return true
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Create a snapshot of all current data
   */
  createSnapshot() {
    return {
      users: [...this._users],
      events: [...this._events],
      participants: [...this._participants],
      assignments: [...this._assignments],
      topics: [...this._topics],
      invitations: [...this._invitations],
      organizers: [...this._organizers]
    }
  }

  /**
   * Restore data from a snapshot
   */
  restoreFromSnapshot(snapshot: ReturnType<typeof MockDataManager.prototype.createSnapshot>): void {
    this._users = [...snapshot.users]
    this._events = [...snapshot.events]
    this._participants = [...snapshot.participants]
    this._assignments = [...snapshot.assignments]
    this._topics = [...snapshot.topics]
    this._invitations = [...snapshot.invitations]
    this._organizers = [...snapshot.organizers]
  }

  /**
   * Get summary of current data state
   */
  getDataSummary() {
    return {
      users: this._users.length,
      events: this._events.length,
      participants: this._participants.length,
      assignments: this._assignments.length,
      topics: this._topics.length,
      invitations: this._invitations.length,
      organizers: this._organizers.length
    }
  }

  // ==================== TOPIC RANKINGS ====================

  private getDefaultTopicRankings(): TopicRanking[] {
    const rankings: TopicRanking[] = []
    const topics = this.getDefaultTopics()
    const topicIds = topics.map(t => t.id)
    
    // Get all participants for event '1'
    const participants = this.getDefaultParticipants().filter(p => p.eventId === '1')
    
    // 5 participants who haven't ranked (about 4% of 130)
    const participantsWithoutRankings = new Set([
      'participant-143', 'participant-144', 'participant-145', 'participant-146', 'participant-147'
    ])
    
    for (const participant of participants) {
      // Skip the participants who haven't ranked
      if (participantsWithoutRankings.has(participant.id)) {
        continue
      }
      
      // Determine how many topics this participant will rank (minimum 6)
      // Most rank 6-15 topics, some rank more
      const numTopicsToRank = Math.min(
        6 + Math.floor(Math.random() * 10), // 6-15 topics
        topicIds.length
      )
      
      // Shuffle and select random topics
      const shuffledTopicIds = [...topicIds].sort(() => Math.random() - 0.5)
      const rankedTopicIds = shuffledTopicIds.slice(0, numTopicsToRank)
      
      // Random date within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30)
      const lastViewedDate = new Date(Date.UTC(2025, 9, 16) - daysAgo * 24 * 60 * 60 * 1000)
      const lastRankedDate = new Date(lastViewedDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      
      rankings.push({
        id: `ranking-${participant.id}`,
        participantId: participant.id,
        eventId: '1',
        rankedTopicIds,
        lastViewedAt: lastViewedDate,
        lastRankedAt: lastRankedDate,
        createdAt: lastViewedDate,
        updatedAt: lastRankedDate
      })
    }
    
    return rankings
  }

  getTopicRankings(): TopicRanking[] {
    return [...this._topicRankings]
  }

  getTopicRankingById(id: string): TopicRanking | undefined {
    return this._topicRankings.find(r => r.id === id)
  }

  getTopicRankingByParticipantAndEvent(participantId: string, eventId: string): TopicRanking | null {
    return this._topicRankings.find(r => r.participantId === participantId && r.eventId === eventId) || null
  }

  getTopicRankingsByEventId(eventId: string): TopicRanking[] {
    return this._topicRankings.filter(r => r.eventId === eventId)
  }

  addTopicRanking(ranking: TopicRanking): void {
    this._topicRankings.push(ranking)
  }

  updateTopicRanking(id: string, updates: Partial<TopicRanking>): boolean {
    const index = this._topicRankings.findIndex(r => r.id === id)
    if (index === -1) return false
    
    this._topicRankings[index] = {
      ...this._topicRankings[index]!,
      ...updates
    }
    return true
  }

  removeTopicRanking(id: string): boolean {
    const index = this._topicRankings.findIndex(r => r.id === id)
    if (index === -1) return false
    
    this._topicRankings.splice(index, 1)
    return true
  }
}

/**
 * Export singleton instance for convenience
 */
export const mockData = MockDataManager.getInstance()

/**
 * Helper function to reset mock data - useful in test setup
 */
export const resetMockData = () => {
  mockData.resetToDefaults()
}

/**
 * Helper function to clear all mock data - useful for isolated tests
 */
export const clearMockData = () => {
  mockData.clearAll()
}