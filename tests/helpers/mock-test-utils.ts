import { test as base } from '@playwright/test'
import { mockData, resetMockData, clearMockData } from './mock-manager'
import type { User } from '../../types/user'
import type { Event } from '../../types/event'
import type { Participant, ParticipantAssignment } from '../../types/participant'

/**
 * Extended test context that includes mock data management utilities
 */
export interface MockTestContext {
  mockData: {
    // Direct access to the mock manager
    manager: typeof mockData
    
    // Convenience methods for common operations
    resetToDefaults: () => void
    clearAll: () => void
    
    // User management
    addTestUser: (user: Partial<User> & { id: string; email: string; firstname: string; lastname: string }) => User
    getTestUsers: () => User[]
    
    // Event management  
    addTestEvent: (event: Partial<Event> & { id: string; name: string }) => Event
    getTestEvents: () => Event[]
    setEvents: (events: Event[]) => void
    
    // Participant management
    addTestParticipant: (participant: Partial<Participant> & { id: string; eventId: string; email: string; firstname: string; lastname: string }) => Participant
    getTestParticipants: (eventId?: string) => Participant[]
    
    // Assignment management
    addTestAssignment: (assignment: Partial<ParticipantAssignment> & { id: string; participantId: string; eventId: string }) => ParticipantAssignment
    getTestAssignments: (eventId?: string) => ParticipantAssignment[]
    
    // Snapshot management for test isolation
    createTestSnapshot: () => ReturnType<typeof mockData.createSnapshot>
    restoreTestSnapshot: (snapshot: ReturnType<typeof mockData.createSnapshot>) => void
  }
}

/**
 * Extended Playwright test with mock data management
 */
export const test = base.extend<MockTestContext>({
  mockData: async ({ page: _ }, use) => {
    // Reset to defaults before each test
    resetMockData()
    
    const mockUtils = {
      manager: mockData,
      
      resetToDefaults: () => resetMockData(),
      clearAll: () => clearMockData(),
      
      addTestUser: (user: Partial<User> & { id: string; email: string; firstname: string; lastname: string }): User => {
        const fullUser: User = {
          password: 'testpassword123',
          role: 'Participant',
          ...user
        }
        mockData.addUser(fullUser)
        return fullUser
      },
      
      getTestUsers: () => mockData.getUsers(),
      
      addTestEvent: (event: Partial<Event> & { id: string; name: string }): Event => {
        const fullEvent: Event = {
          description: 'Test event description',
          location: 'Test location',
          startDate: new Date('2025-12-01T09:00:00Z'),
          endDate: new Date('2025-12-01T17:00:00Z'),
          numberOfRounds: 3,
          discussionsPerRound: 5,
          idealGroupSize: 8,
          minGroupSize: 5,
          maxGroupSize: 10,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            enableTopicRanking: true,
            enableAutoAssignment: false,
            maxTopicsPerParticipant: 3,
            requireApproval: false,
            maxParticipants: 100
          },
          ...event
        }
        mockData.addEvent(fullEvent)
        return fullEvent
      },
      
      getTestEvents: () => mockData.getEvents(),
      
      setEvents: (events: Event[]) => mockData.setEvents(events),
      
      addTestParticipant: (participant: Partial<Participant> & { id: string; eventId: string; email: string; firstname: string; lastname: string }): Participant => {
        const fullParticipant: Participant = {
          userId: `user-${Date.now()}`,
          status: 'registered',
          registrationDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...participant
        }
        mockData.addParticipant(fullParticipant)
        return fullParticipant
      },
      
      getTestParticipants: (eventId?: string) => {
        return eventId ? mockData.getParticipantsByEventId(eventId) : mockData.getParticipants()
      },
      
      addTestAssignment: (assignment: Partial<ParticipantAssignment> & { id: string; participantId: string; eventId: string }): ParticipantAssignment => {
        const fullAssignment: ParticipantAssignment = {
          topicId: `topic-${Date.now()}`,
          roundNumber: 1,
          groupNumber: 1,
          assignmentMethod: 'automatic',
          status: 'assigned',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...assignment
        }
        mockData.addAssignment(fullAssignment)
        return fullAssignment
      },
      
      getTestAssignments: (eventId?: string) => {
        return eventId ? mockData.getAssignmentsByEventId(eventId) : mockData.getAssignments()
      },
      
      createTestSnapshot: () => mockData.createSnapshot(),
      restoreTestSnapshot: (snapshot: ReturnType<typeof mockData.createSnapshot>) => mockData.restoreFromSnapshot(snapshot)
    }
    
    await use(mockUtils)
    
    // Cleanup after each test - reset to defaults
    resetMockData()
  }
})

/**
 * Re-export expect from Playwright for convenience
 */
export { expect } from '@playwright/test'

/**
 * Test utilities for common mock scenarios
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MockScenarios {
  /**
   * Setup a typical unconference event with participants and assignments
   */
  static setupUnconferenceEvent() {
    // This will use the default event, participants, and assignments
    // that are already configured in the mock manager
    resetMockData()
    return {
      event: mockData.getEventById('1')!,
      participants: mockData.getParticipantsByEventId('1'),
      assignments: mockData.getAssignmentsByEventId('1')
    }
  }
  
  /**
   * Setup an event with no participants (fresh event)
   */
  static setupEmptyEvent() {
    clearMockData()
    const event = mockData.addEvent({
      id: 'empty-1',
      name: 'Empty Test Event',
      description: 'Empty event for testing',
      location: 'Test location',
      startDate: new Date('2025-12-01T09:00:00Z'),
      endDate: new Date('2025-12-01T17:00:00Z'),
      numberOfRounds: 3,
      discussionsPerRound: 5,
      idealGroupSize: 8,
      minGroupSize: 5,
      maxGroupSize: 10,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        enableTopicRanking: true,
        enableAutoAssignment: false,
        maxTopicsPerParticipant: 3,
        requireApproval: false,
        maxParticipants: 100
      }
    })
    return { event }
  }
  
  /**
   * Setup event with many participants for load testing
   */
  static setupLargeEvent(participantCount: number = 50) {
    const scenario = this.setupUnconferenceEvent()
    
    // Add additional participants beyond the default 3
    const startingParticipants = scenario.participants.length
    const additionalParticipants = participantCount - startingParticipants
    
    for (let i = 1; i <= additionalParticipants; i++) {
      const participantId = `participant-${startingParticipants + i}`
      mockData.addParticipant({
        id: participantId,
        eventId: '1',
        userId: `user-${startingParticipants + i}`,
        email: `user${startingParticipants + i}@example.com`,
        firstname: `User${startingParticipants + i}`,
        lastname: `Test`,
        status: Math.random() > 0.3 ? 'confirmed' : 'registered',
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    return scenario
  }
}