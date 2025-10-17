/**
 * Access control utilities for role-based permissions
 */

import { organizerService } from '../services'

/**
 * User session interface (matches nuxt-auth-utils)
 */
export interface UserSession {
  user: {
    id?: string
    email?: string
    role?: 'Admin' | 'Organizer' | 'Participant'
    [key: string]: any
  }
}

/**
 * Check if a user has admin role
 */
export function isAdmin(session: UserSession | null | undefined): boolean {
  if (!session?.user) return false
  return session.user.role === 'Admin'
}

/**
 * Check if a user is an organizer for a specific event
 */
export async function isOrganizer(
  eventId: string, 
  session: UserSession | null | undefined
): Promise<boolean> {
  try {
    if (!session?.user) return false
    
    const userId = session.user.id
    const email = session.user.email
    
    if (!userId && !email) return false
    
    return await organizerService.isOrganizer(eventId, userId, email)
  } catch (error) {
    console.error('Error checking organizer status', { eventId, error })
    return false
  }
}

/**
 * Check if a user can manage an event (admin or organizer)
 */
export async function canManageEvent(
  eventId: string,
  session: UserSession | null | undefined
): Promise<boolean> {
  // Admins can manage all events
  if (isAdmin(session)) {
    return true
  }
  
  // Check if user is an organizer for this event
  return await isOrganizer(eventId, session)
}

/**
 * Check if a user can view/manage topics for an event (admin, organizer, or participant)
 */
export async function canViewEventTopics(
  eventId: string,
  session: UserSession | null | undefined,
  isParticipant: boolean = false
): Promise<boolean> {
  // Admins can view all topics
  if (isAdmin(session)) {
    return true
  }
  
  // Organizers can view all topics for their events
  if (await isOrganizer(eventId, session)) {
    return true
  }
  
  // Participants can view topics for events they're registered for
  return isParticipant
}

/**
 * Check if a user can edit a specific topic
 */
export async function canEditTopic(
  eventId: string,
  topicProposerId: string,
  session: UserSession | null | undefined,
  participantId?: string
): Promise<boolean> {
  // Admins can edit any topic
  if (isAdmin(session)) {
    return true
  }
  
  // Organizers can edit any topic for their events
  if (await isOrganizer(eventId, session)) {
    return true
  }
  
  // Users can edit their own topics
  if (participantId && topicProposerId === participantId) {
    return true
  }
  
  // Check if the proposer matches user identifier directly (for admin-submitted topics)
  const userIdentifier = session?.user?.email || session?.user?.id
  if (userIdentifier && topicProposerId === userIdentifier) {
    return true
  }
  
  return false
}

/**
 * Check if a user can delete a specific topic
 */
export async function canDeleteTopic(
  eventId: string,
  topicProposerId: string,
  session: UserSession | null | undefined,
  participantId?: string
): Promise<boolean> {
  // Use same logic as edit for now
  return await canEditTopic(eventId, topicProposerId, session, participantId)
}

/**
 * Check if a user can change topic status
 */
export async function canChangeTopicStatus(
  eventId: string,
  session: UserSession | null | undefined
): Promise<boolean> {
  // Only admins and organizers can change topic status
  if (isAdmin(session)) {
    return true
  }
  
  return await isOrganizer(eventId, session)
}

/**
 * Get organizer permissions for an event
 */
export async function getOrganizerPermissions(
  eventId: string,
  session: UserSession | null | undefined
) {
  try {
    if (!session?.user) return null
    
    const userId = session.user.id
    const email = session.user.email
    
    if (!userId && !email) return null
    
    const organizer = await organizerService.getOrganizerForEvent(eventId, userId, email)
    return organizer?.permissions || null
  } catch (error) {
    console.error('Error getting organizer permissions', { eventId, error })
    return null
  }
}
