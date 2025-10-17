import type { User } from '../../types/user'
import type { Event } from '../../types/event'
import type { Participant, ParticipantAssignment } from '../../types/participant'
import type { Topic } from '../../types/topic'
import type { Invitation } from '../../types/invitation'
import type { TopicRanking } from '../../types/topicRanking'
import type { Organizer } from '../../types/organizer'
import { MockDataManager } from './mock-manager'

/**
 * Test-Isolated Mock Data Manager
 * 
 * This manager provides per-test isolation by using unique context IDs.
 * Each test gets its own isolated data store that doesn't interfere with other tests.
 * 
 * Usage in tests:
 * 1. Generate a unique context ID for each test (e.g., using test worker ID + timestamp)
 * 2. Pass the context ID with all API requests via headers
 * 3. The server-side service layer uses the context ID to access the correct data store
 */
export class TestIsolatedMockDataManager {
  private static instance: TestIsolatedMockDataManager
  private stores: Map<string, MockDataStore> = new Map()
  private defaultStore: MockDataStore

  private constructor() {
    // Keep a default store for backward compatibility
    this.defaultStore = new MockDataStore()
    this.defaultStore.resetToDefaults()
  }

  static getInstance(): TestIsolatedMockDataManager {
    if (!TestIsolatedMockDataManager.instance) {
      TestIsolatedMockDataManager.instance = new TestIsolatedMockDataManager()
    }
    return TestIsolatedMockDataManager.instance
  }

  /**
   * Get or create a data store for a specific test context
   */
  getStore(contextId?: string): MockDataStore {
    if (!contextId) {
      return this.defaultStore
    }

    if (!this.stores.has(contextId)) {
      const store = new MockDataStore()
      store.resetToDefaults()
      this.stores.set(contextId, store)
    }

    return this.stores.get(contextId)!
  }

  /**
   * Delete a test context's data store (cleanup after test)
   */
  deleteStore(contextId: string): void {
    this.stores.delete(contextId)
  }

  /**
   * Get all active context IDs (for debugging)
   */
  getActiveContexts(): string[] {
    return Array.from(this.stores.keys())
  }

  /**
   * Clear all stores except default (for cleanup)
   */
  clearAll(): void {
    this.stores.clear()
  }
}

/**
 * Individual data store for a test context
 */
class MockDataStore {
  private _users: User[] = []
  private _events: Event[] = []
  private _participants: Participant[] = []
  private _assignments: ParticipantAssignment[] = []
  private _topics: Topic[] = []
  private _invitations: Invitation[] = []
  private _topicRankings: TopicRanking[] = []
  private _organizers: Organizer[] = []

  // Delegate to the original MockDataManager for default data generation
  private static mockDataManager = MockDataManager.getInstance()

  resetToDefaults(): void {
    // Get fresh copies of default data
    const tempManager = MockDataManager.getInstance()
    this._users = JSON.parse(JSON.stringify(tempManager.getUsers()))
    this._events = JSON.parse(JSON.stringify(tempManager.getEvents()))
    this._participants = JSON.parse(JSON.stringify(tempManager.getParticipants()))
    this._assignments = JSON.parse(JSON.stringify(tempManager.getAssignments()))
    this._topics = JSON.parse(JSON.stringify(tempManager.getTopics()))
    this._invitations = JSON.parse(JSON.stringify(tempManager.getInvitations()))
    this._topicRankings = JSON.parse(JSON.stringify(tempManager.getTopicRankings()))
    this._organizers = JSON.parse(JSON.stringify(tempManager.getOrganizers()))
  }

  // Users
  getUsers(): User[] { return this._users }
  setUsers(users: User[]): void { this._users = users }
  getUserByEmail(email: string): User | undefined {
    return this._users.find(u => u.email === email)
  }
  addUser(user: User): void {
    const existingIndex = this._users.findIndex(u => u.email === user.email)
    if (existingIndex >= 0) {
      this._users[existingIndex] = user
    } else {
      this._users.push(user)
    }
  }
  updateUser(email: string, updates: Partial<User>): boolean {
    const user = this._users.find(u => u.email === email)
    if (user) {
      Object.assign(user, updates)
      return true
    }
    return false
  }
  removeUser(email: string): boolean {
    const index = this._users.findIndex(u => u.email === email)
    if (index >= 0) {
      this._users.splice(index, 1)
      return true
    }
    return false
  }

  // Events
  getEvents(): Event[] { return this._events }
  setEvents(events: Event[]): void { this._events = events }
  getEventById(id: string): Event | undefined {
    return this._events.find(e => e.id === id)
  }
  addEvent(event: Event): void {
    const existingIndex = this._events.findIndex(e => e.id === event.id)
    if (existingIndex >= 0) {
      this._events[existingIndex] = event
    } else {
      this._events.push(event)
    }
  }
  updateEvent(id: string, updates: Partial<Event>): boolean {
    const event = this._events.find(e => e.id === id)
    if (event) {
      Object.assign(event, updates)
      return true
    }
    return false
  }
  removeEvent(id: string): boolean {
    const index = this._events.findIndex(e => e.id === id)
    if (index >= 0) {
      this._events.splice(index, 1)
      return true
    }
    return false
  }

  // Participants
  getParticipants(): Participant[] { return this._participants }
  setParticipants(participants: Participant[]): void { this._participants = participants }
  getParticipantsByEventId(eventId: string): Participant[] {
    return this._participants.filter(p => p.eventId === eventId)
  }
  getParticipantById(id: string): Participant | undefined {
    return this._participants.find(p => p.id === id)
  }
  addParticipant(participant: Participant): void {
    const existingIndex = this._participants.findIndex(p => p.id === participant.id)
    if (existingIndex >= 0) {
      this._participants[existingIndex] = participant
    } else {
      this._participants.push(participant)
    }
  }
  updateParticipant(id: string, updates: Partial<Participant>): boolean {
    const participant = this._participants.find(p => p.id === id)
    if (participant) {
      Object.assign(participant, updates)
      return true
    }
    return false
  }
  removeParticipant(id: string): boolean {
    const index = this._participants.findIndex(p => p.id === id)
    if (index >= 0) {
      this._participants.splice(index, 1)
      return true
    }
    return false
  }

  // Topics
  getTopics(): Topic[] { return this._topics }
  setTopics(topics: Topic[]): void { this._topics = topics }
  getTopicsByEventId(eventId: string): Topic[] {
    return this._topics.filter(t => t.eventId === eventId)
  }
  getTopicById(id: string): Topic | undefined {
    return this._topics.find(t => t.id === id)
  }
  addTopic(topic: Topic): void {
    const existingIndex = this._topics.findIndex(t => t.id === topic.id)
    if (existingIndex >= 0) {
      this._topics[existingIndex] = topic
    } else {
      this._topics.push(topic)
    }
  }
  updateTopic(id: string, updates: Partial<Topic>): boolean {
    const topic = this._topics.find(t => t.id === id)
    if (topic) {
      Object.assign(topic, updates)
      return true
    }
    return false
  }
  removeTopic(id: string): boolean {
    const index = this._topics.findIndex(t => t.id === id)
    if (index >= 0) {
      this._topics.splice(index, 1)
      return true
    }
    return false
  }

  // Assignments
  getAssignments(): ParticipantAssignment[] { return this._assignments }
  setAssignments(assignments: ParticipantAssignment[]): void { this._assignments = assignments }
  getAssignmentsByEventId(eventId: string): ParticipantAssignment[] {
    return this._assignments.filter(a => a.eventId === eventId)
  }
  addAssignment(assignment: ParticipantAssignment): void {
    const existingIndex = this._assignments.findIndex(
      a => a.participantId === assignment.participantId && a.topicId === assignment.topicId
    )
    if (existingIndex >= 0) {
      this._assignments[existingIndex] = assignment
    } else {
      this._assignments.push(assignment)
    }
  }
  removeAssignment(participantId: string, topicId: string): boolean {
    const index = this._assignments.findIndex(
      a => a.participantId === participantId && a.topicId === topicId
    )
    if (index >= 0) {
      this._assignments.splice(index, 1)
      return true
    }
    return false
  }

  // Invitations
  getInvitations(): Invitation[] { return this._invitations }
  setInvitations(invitations: Invitation[]): void { this._invitations = invitations }
  getInvitationsByEventId(eventId: string): Invitation[] {
    return this._invitations.filter(i => i.eventId === eventId)
  }
  getInvitationById(id: string): Invitation | undefined {
    return this._invitations.find(i => i.id === id)
  }
  addInvitation(invitation: Invitation): void {
    const existingIndex = this._invitations.findIndex(i => i.id === invitation.id)
    if (existingIndex >= 0) {
      this._invitations[existingIndex] = invitation
    } else {
      this._invitations.push(invitation)
    }
  }
  updateInvitation(id: string, updates: Partial<Invitation>): boolean {
    const invitation = this._invitations.find(i => i.id === id)
    if (invitation) {
      Object.assign(invitation, updates)
      return true
    }
    return false
  }
  removeInvitation(id: string): boolean {
    const index = this._invitations.findIndex(i => i.id === id)
    if (index >= 0) {
      this._invitations.splice(index, 1)
      return true
    }
    return false
  }

  // Topic Rankings
  getTopicRankings(): TopicRanking[] { return this._topicRankings }
  setTopicRankings(rankings: TopicRanking[]): void { this._topicRankings = rankings }
  getTopicRankingsByEventId(eventId: string): TopicRanking[] {
    return this._topicRankings.filter(r => r.eventId === eventId)
  }
  getTopicRankingById(id: string): TopicRanking | undefined {
    return this._topicRankings.find(r => r.id === id)
  }
  addTopicRanking(ranking: TopicRanking): void {
    const existingIndex = this._topicRankings.findIndex(r => r.id === ranking.id)
    if (existingIndex >= 0) {
      this._topicRankings[existingIndex] = ranking
    } else {
      this._topicRankings.push(ranking)
    }
  }
  updateTopicRanking(id: string, updates: Partial<TopicRanking>): boolean {
    const ranking = this._topicRankings.find(r => r.id === id)
    if (ranking) {
      Object.assign(ranking, updates)
      return true
    }
    return false
  }
  removeTopicRanking(id: string): boolean {
    const index = this._topicRankings.findIndex(r => r.id === id)
    if (index >= 0) {
      this._topicRankings.splice(index, 1)
      return true
    }
    return false
  }

  // Organizers
  getOrganizers(): Organizer[] { return this._organizers }
  setOrganizers(organizers: Organizer[]): void { this._organizers = organizers }
  getOrganizersByEventId(eventId: string): Organizer[] {
    return this._organizers.filter(o => o.eventId === eventId)
  }
  getOrganizerById(id: string): Organizer | undefined {
    return this._organizers.find(o => o.id === id)
  }
  addOrganizer(organizer: Organizer): void {
    const existingIndex = this._organizers.findIndex(o => o.id === organizer.id)
    if (existingIndex >= 0) {
      this._organizers[existingIndex] = organizer
    } else {
      this._organizers.push(organizer)
    }
  }
  updateOrganizer(id: string, updates: Partial<Organizer>): boolean {
    const organizer = this._organizers.find(o => o.id === id)
    if (organizer) {
      Object.assign(organizer, updates)
      return true
    }
    return false
  }
  removeOrganizer(id: string): boolean {
    const index = this._organizers.findIndex(o => o.id === id)
    if (index >= 0) {
      this._organizers.splice(index, 1)
      return true
    }
    return false
  }
}

// Export singleton instance
export const testIsolatedMockData = TestIsolatedMockDataManager.getInstance()
