import type { User } from '../../types/user'
import type { Event } from '../../types/event'
import type { Participant, ParticipantAssignment } from '../../types/participant'

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
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this._users = []
    this._events = []
    this._participants = []
    this._assignments = []
  }

  // ==================== USERS ====================

  private getDefaultUsers(): User[] {
    return [
      {
        firstname: "Luke",
        lastname: "Skywalker",
        email: "luke@rebels.com",
        password: "changeme",
        role: "Admin"
      },
      {
        firstname: "Darth",
        lastname: "Vador",
        email: "darth@empire.com",
        password: "changeme",
        role: "User"
      }
    ]
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
      email: updates.email ?? currentUser.email,
      firstname: updates.firstname ?? currentUser.firstname,
      lastname: updates.lastname ?? currentUser.lastname,
      password: updates.password ?? currentUser.password,
      role: updates.role ?? currentUser.role
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
          enableAutoAssignment: false,
          maxTopicsPerParticipant: 3,
          requireApproval: false,
          maxParticipants: 100
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
    return [
      {
        id: 'participant-1',
        eventId: '1',
        userId: 'user-1',
        email: 'john.doe@example.com',
        firstname: 'John',
        lastname: 'Doe',
        status: 'confirmed',
        registrationDate: new Date('2025-09-01T00:00:00Z'),
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z')
      },
      {
        id: 'participant-2',
        eventId: '1',
        userId: 'user-2',
        email: 'jane.smith@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        status: 'checked-in',
        registrationDate: new Date('2025-09-02T00:00:00Z'),
        createdAt: new Date('2025-09-02T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z')
      },
      {
        id: 'participant-3',
        eventId: '1',
        userId: 'user-3',
        email: 'bob.johnson@example.com',
        firstname: 'Bob',
        lastname: 'Johnson',
        status: 'registered',
        registrationDate: new Date('2025-09-05T00:00:00Z'),
        createdAt: new Date('2025-09-05T00:00:00Z'),
        updatedAt: new Date('2025-09-05T00:00:00Z')
      }
    ]
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

  // ==================== UTILITY METHODS ====================

  /**
   * Create a snapshot of all current data
   */
  createSnapshot() {
    return {
      users: [...this._users],
      events: [...this._events],
      participants: [...this._participants],
      assignments: [...this._assignments]
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
  }

  /**
   * Get summary of current data state
   */
  getDataSummary() {
    return {
      users: this._users.length,
      events: this._events.length,
      participants: this._participants.length,
      assignments: this._assignments.length
    }
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