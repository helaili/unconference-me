/**
 * Zod schemas for runtime validation of models
 */
import { z } from 'zod'

/**
 * Event schema
 */
export const eventSettingsSchema = z.object({
  enableTopicRanking: z.boolean().optional(),
  enableAutoAssignment: z.boolean().optional(),
  maxTopicsPerParticipant: z.number().int().positive().optional(),
  requireApproval: z.boolean().optional(),
  maxParticipants: z.number().int().positive().optional(),
  customSettings: z.record(z.any()).optional()
})

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  numberOfRounds: z.number().int().positive(),
  discussionsPerRound: z.number().int().positive(),
  idealGroupSize: z.number().int().positive(),
  minGroupSize: z.number().int().positive(),
  maxGroupSize: z.number().int().positive(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
  settings: eventSettingsSchema.optional()
}).refine(
  (data) => data.minGroupSize <= data.idealGroupSize && data.idealGroupSize <= data.maxGroupSize,
  {
    message: "Group sizes must follow: minGroupSize <= idealGroupSize <= maxGroupSize"
  }
).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: "Event start date must be before or equal to end date"
  }
)

/**
 * Topic schema
 */
export const topicMetadataSchema = z.object({
  averageRanking: z.number().optional(),
  interestCount: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  customMetadata: z.record(z.any()).optional()
})

export const topicSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  proposedBy: z.string(),
  status: z.enum(['proposed', 'approved', 'scheduled', 'completed', 'rejected']),
  roundNumber: z.number().int().positive().optional(),
  groupNumber: z.number().int().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: topicMetadataSchema.optional()
})

/**
 * Participant schema
 */
export const participantPreferencesSchema = z.object({
  topicRankings: z.record(z.number().int().positive()).optional(),
  preferredRounds: z.array(z.number().int().positive()).optional(),
  notes: z.string().optional(),
  customPreferences: z.record(z.any()).optional()
})

export const participantSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string().optional(),
  email: z.string().email(),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  status: z.enum(['registered', 'confirmed', 'checked-in', 'cancelled']),
  registrationDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  preferences: participantPreferencesSchema.optional()
})

export const participantAssignmentSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  topicId: z.string(),
  eventId: z.string(),
  roundNumber: z.number().int().positive(),
  groupNumber: z.number().int().positive(),
  assignmentMethod: z.enum(['manual', 'automatic', 'self-selected']),
  status: z.enum(['assigned', 'confirmed', 'declined', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date()
})

/**
 * Organizer schema
 */
export const organizerPermissionsSchema = z.object({
  canEditEvent: z.boolean().optional(),
  canDeleteEvent: z.boolean().optional(),
  canApproveParticipants: z.boolean().optional(),
  canRemoveParticipants: z.boolean().optional(),
  canApprovTopics: z.boolean().optional(),
  canRejectTopics: z.boolean().optional(),
  canScheduleTopics: z.boolean().optional(),
  canManageAssignments: z.boolean().optional(),
  canRunAutoAssignment: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canExportData: z.boolean().optional(),
  customPermissions: z.record(z.boolean()).optional()
})

export const organizerSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string().optional(),
  email: z.string().email(),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  role: z.enum(['owner', 'admin', 'moderator']),
  status: z.enum(['active', 'inactive']),
  createdAt: z.date(),
  updatedAt: z.date(),
  permissions: organizerPermissionsSchema.optional()
})
