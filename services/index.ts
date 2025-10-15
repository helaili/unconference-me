// Export all data services
export { userService, UserService } from './userService'
export { eventService, EventService } from './eventService'
export { participantService, ParticipantService } from './participantService'
export { topicService, TopicService } from './topicService'
export { assignmentService, AssignmentService } from './assignmentService'
export { invitationService, InvitationService } from './invitationService'
export { topicRankingService, TopicRankingService } from './topicRankingService'
export { organizerService, OrganizerService } from './organizerService'
export { BaseService } from './baseService'

// Service type definitions for convenience
export type Services = {
  userService: typeof import('./userService').userService
  eventService: typeof import('./eventService').eventService
  participantService: typeof import('./participantService').participantService
  topicService: typeof import('./topicService').topicService
  assignmentService: typeof import('./assignmentService').assignmentService
  invitationService: typeof import('./invitationService').invitationService
  topicRankingService: typeof import('./topicRankingService').topicRankingService
  organizerService: typeof import('./organizerService').organizerService
}