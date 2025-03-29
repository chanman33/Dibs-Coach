/**
 * Schedule Mapper Utility
 * 
 * Provides mapping functions to convert between Cal.com API format and our database format
 * for availability schedules. This helps maintain a clean separation between external APIs
 * and our internal data model.
 */

import { generateUlid } from '@/utils/ulid';
import {
  CalSchedule,
  CoachingSchedule,
  ScheduleAvailability,
  ScheduleOverrides,
  SCHEDULE_SYNC_SOURCE,
  serializeJsonField,
  parseJsonField,
  toIsoString
} from '@/utils/types/schedule';

/**
 * Transforms a Cal.com schedule to our database format
 */
export function mapCalScheduleToDbSchedule(
  calSchedule: CalSchedule,
  userUlid: string,
  existingSchedule?: Partial<CoachingSchedule>
): CoachingSchedule {
  // Create a new schedule or update existing one
  const now = new Date().toISOString();
  
  return {
    // Core identification fields
    ulid: existingSchedule?.ulid || generateUlid(),
    userUlid: userUlid,
    
    // Basic schedule information
    name: calSchedule.name,
    timeZone: calSchedule.timeZone,
    
    // Cal.com integration fields
    calScheduleId: calSchedule.id || existingSchedule?.calScheduleId || null,
    syncSource: SCHEDULE_SYNC_SOURCE.CALCOM,
    lastSyncedAt: now,
    
    // Availability data - store as serialized JSON
    availability: calSchedule.availability,
    overrides: calSchedule.overrides || null,
    
    // Default settings
    isDefault: calSchedule.isDefault || false,
    active: true,
    
    // Duration settings (defaults if not specified)
    allowCustomDuration: existingSchedule?.allowCustomDuration || false,
    defaultDuration: existingSchedule?.defaultDuration || 60,
    maximumDuration: existingSchedule?.maximumDuration || 120,
    minimumDuration: existingSchedule?.minimumDuration || 30,
    
    // Buffer settings
    bufferAfter: existingSchedule?.bufferAfter || 0,
    bufferBefore: existingSchedule?.bufferBefore || 0,
    
    // Stats
    averageRating: existingSchedule?.averageRating || null,
    totalSessions: existingSchedule?.totalSessions || 0,
    
    // Integration settings
    zoomEnabled: existingSchedule?.zoomEnabled || false,
    calendlyEnabled: existingSchedule?.calendlyEnabled || false,
    
    // Timestamps
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Prepares schedule data for database insertion
 * Handles JSON serialization and date formatting
 */
export function prepareScheduleForDb(schedule: CoachingSchedule) {
  // Make sure all timestamps are strings and never null
  const now = new Date().toISOString();
  
  return {
    ulid: schedule.ulid,
    userUlid: schedule.userUlid,
    name: schedule.name,
    timeZone: schedule.timeZone,
    calScheduleId: schedule.calScheduleId,
    availability: serializeJsonField(schedule.availability),
    overrides: schedule.overrides ? serializeJsonField(schedule.overrides) : null,
    syncSource: schedule.syncSource,
    lastSyncedAt: toIsoString(schedule.lastSyncedAt) || now,
    isDefault: schedule.isDefault,
    active: schedule.active,
    allowCustomDuration: schedule.allowCustomDuration,
    defaultDuration: schedule.defaultDuration,
    maximumDuration: schedule.maximumDuration,
    minimumDuration: schedule.minimumDuration,
    bufferAfter: schedule.bufferAfter,
    bufferBefore: schedule.bufferBefore,
    averageRating: schedule.averageRating,
    totalSessions: schedule.totalSessions,
    zoomEnabled: schedule.zoomEnabled,
    calendlyEnabled: schedule.calendlyEnabled,
    createdAt: toIsoString(schedule.createdAt) || now,
    updatedAt: toIsoString(schedule.updatedAt) || now
  };
}

/**
 * Transforms our database schedule to Cal.com API format for sending updates
 */
export function mapDbScheduleToCalPayload(dbSchedule: CoachingSchedule): Omit<CalSchedule, 'id'> {
  return {
    name: dbSchedule.name,
    timeZone: dbSchedule.timeZone,
    availability: parseJsonField<ScheduleAvailability>(dbSchedule.availability),
    isDefault: dbSchedule.isDefault || false,
    overrides: dbSchedule.overrides ? parseJsonField<ScheduleOverrides>(dbSchedule.overrides) : undefined
  };
}

/**
 * Updates the sync status of a schedule
 */
export function updateScheduleSyncStatus(
  schedule: CoachingSchedule, 
  syncSource: typeof SCHEDULE_SYNC_SOURCE[keyof typeof SCHEDULE_SYNC_SOURCE] = SCHEDULE_SYNC_SOURCE.SYNCED
): CoachingSchedule {
  return {
    ...schedule,
    syncSource,
    lastSyncedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Find the differences between two schedules
 * Returns true if there are significant differences that require an update
 */
export function hasScheduleChanges(
  dbSchedule: CoachingSchedule,
  calSchedule: CalSchedule
): boolean {
  // Check basic properties
  if (
    dbSchedule.name !== calSchedule.name ||
    dbSchedule.timeZone !== calSchedule.timeZone ||
    dbSchedule.isDefault !== calSchedule.isDefault
  ) {
    return true;
  }

  // Compare availability (days, start/end times)
  if (!areAvailabilitySlotsEqual(dbSchedule.availability, calSchedule.availability)) {
    return true;
  }

  // Compare overrides if they exist
  if (calSchedule.overrides && dbSchedule.overrides) {
    if (!areOverridesEqual(dbSchedule.overrides, calSchedule.overrides)) {
      return true;
    }
  } else if ((calSchedule.overrides && !dbSchedule.overrides) || 
             (!calSchedule.overrides && dbSchedule.overrides)) {
    // One has overrides, the other doesn't
    return true;
  }

  // No significant changes found
  return false;
}

/**
 * Helper to compare availability slots
 */
function areAvailabilitySlotsEqual(
  dbSlots: ScheduleAvailability | string, 
  calSlots: ScheduleAvailability
): boolean {
  // Parse dbSlots if it's a string
  const parsedDbSlots = typeof dbSlots === 'string' ? JSON.parse(dbSlots) : dbSlots;
  
  if (!parsedDbSlots || !calSlots) return false;
  if (parsedDbSlots.length !== calSlots.length) return false;

  // Sort both arrays to ensure consistent comparison
  const sortedDbSlots = [...parsedDbSlots].sort((a, b) => 
    a.startTime.localeCompare(b.startTime));
  const sortedCalSlots = [...calSlots].sort((a, b) => 
    a.startTime.localeCompare(b.startTime));

  // Compare each slot
  for (let i = 0; i < sortedDbSlots.length; i++) {
    const dbSlot = sortedDbSlots[i];
    const calSlot = sortedCalSlots[i];
    
    // Compare days (they might be in different order)
    const dbDays = [...dbSlot.days].sort();
    const calDays = [...calSlot.days].sort();
    
    if (dbDays.length !== calDays.length) return false;
    for (let j = 0; j < dbDays.length; j++) {
      if (dbDays[j] !== calDays[j]) return false;
    }
    
    // Compare times
    if (dbSlot.startTime !== calSlot.startTime || 
        dbSlot.endTime !== calSlot.endTime) {
      return false;
    }
  }
  
  return true;
}

/**
 * Helper to compare schedule overrides
 */
function areOverridesEqual(
  dbOverrides: ScheduleOverrides | string | null, 
  calOverrides: ScheduleOverrides
): boolean {
  // Handle null case
  if (!dbOverrides) return calOverrides.length === 0;
  
  // Parse dbOverrides if it's a string
  const parsedDbOverrides = typeof dbOverrides === 'string' ? JSON.parse(dbOverrides) : dbOverrides;
  
  if (parsedDbOverrides.length !== calOverrides.length) return false;

  // Sort both arrays by date for consistent comparison
  const sortedDbOverrides = [...parsedDbOverrides].sort((a, b) => 
    a.date.localeCompare(b.date));
  const sortedCalOverrides = [...calOverrides].sort((a, b) => 
    a.date.localeCompare(b.date));

  // Compare each override
  for (let i = 0; i < sortedDbOverrides.length; i++) {
    const dbOverride = sortedDbOverrides[i];
    const calOverride = sortedCalOverrides[i];
    
    if (dbOverride.date !== calOverride.date ||
        dbOverride.startTime !== calOverride.startTime ||
        dbOverride.endTime !== calOverride.endTime) {
      return false;
    }
  }
  
  return true;
} 