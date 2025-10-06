/**
 * Organizer model represents a person with administrative permissions for an event
 */
export interface Organizer {
  id: string
  eventId: string
  
  // User information
  userId?: string // Reference to User if they have an account
  email: string
  firstname: string
  lastname: string
  
  // Organizer role and permissions
  role: 'owner' | 'admin' | 'moderator'
  
  // Status
  status: 'active' | 'inactive'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Future extensibility for permissions and capabilities
  permissions?: OrganizerPermissions
}

/**
 * Organizer permissions for future extensibility
 */
export interface OrganizerPermissions {
  // Event management
  canEditEvent?: boolean
  canDeleteEvent?: boolean
  
  // Participant management
  canApproveParticipants?: boolean
  canRemoveParticipants?: boolean
  
  // Topic management
  canApproveTopics?: boolean
  canRejectTopics?: boolean
  canScheduleTopics?: boolean
  
  // Assignment management
  canManageAssignments?: boolean
  canRunAutoAssignment?: boolean
  
  // Reporting and analytics
  canViewReports?: boolean
  canExportData?: boolean
  
  // Additional custom permissions
  customPermissions?: Record<string, boolean>
}
