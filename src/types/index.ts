/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST Smart Class Scheduling System - Domain Type Definitions
 */

export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type SessionStatus = 'SCHEDULED' | 'CANCELLED' | 'RESCHEDULED';

export interface Department {
  id: string;
  code: string; // e.g. "CE", "EE", "ME", "CEV", "BME", "CHE"
  name: string; // e.g. "Computer Engineering"
  faculty: string; // "Faculty of Electrical and Computer Engineering"
}

export interface StudentGroup {
  id: string;
  name: string; // e.g. "Computer Engineering Year 2"
  code: string; // "CE-Y2"
  departmentId: string;
  yearLevel: number; // 1, 2, 3, 4
  population: number; // e.g. 110
}

export interface Course {
  id: string;
  code: string; // e.g. "COE 251"
  title: string; // e.g. "Data Structures and Algorithms"
  creditHours: number;
  departmentId: string;
}

export interface Lecturer {
  id: string;
  title: string; // e.g. "Prof.", "Dr.", "Ing."
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  officeLocation?: string;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "PB 001"
  building: string; // e.g. "Petroleum Building"
  capacity: number; // e.g. 300
  floor?: string; // "Ground Floor"
  hasAirConditioning: boolean;
  hasProjector: boolean;
  hasAudioSystem: boolean;
  notes?: string;
}

export interface MergedClassDetails {
  isMerged: boolean;
  mergedTitle?: string; // e.g. "Joint Applied Mathematics I"
  participatingDepartmentIds: string[];
  totalExpectedStudents: number;
}

export interface LectureSession {
  id: string;
  title?: string;
  day: DayOfWeek;
  startTime: string; // "08:00" (24hr format)
  endTime: string; // "10:00"
  classroomId: string;
  primaryLecturerId: string;
  secondaryLecturerIds?: string[];
  status: SessionStatus;
  
  // Relations: One lecture session can contain multiple courses and student groups
  courseIds: string[];
  studentGroupIds: string[];
  
  // Merged class metadata
  isMerged: boolean;
  mergedGroupId?: string; // Identifier connecting merged partners
  mergedTitle?: string;

  // History / tracking
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledByUserId?: string;

  // Rescheduling tracking
  rescheduledFromId?: string; // Points to original session if this is the new one
  rescheduledToId?: string; // Points to new session if this was rescheduled
  rescheduledReason?: string;
  rescheduledAt?: string;
  originalDay?: DayOfWeek;
  originalStartTime?: string;
  originalEndTime?: string;
  originalClassroomId?: string;

  academicYear: string; // e.g. "2026/2027"
  semester: 1 | 2;
}

export interface NotificationItem {
  id: string;
  type: 'CANCELLATION' | 'RESCHEDULE' | 'ROOM_CHANGE' | 'SYSTEM' | 'MERGED_CLASS';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedSessionId?: string;
  courseCodes: string[];
  targetDepartmentIds: string[];
  targetGroupIds: string[];
  authorName: string;
  authorRole: UserRole;
  details?: {
    originalTime?: string;
    originalRoom?: string;
    newTime?: string;
    newRoom?: string;
    reason?: string;
  };
}

export interface SchedulingHistoryRecord {
  id: string;
  sessionId: string;
  action: 'CREATED' | 'CANCELLED' | 'RESCHEDULED' | 'ROOM_CHANGED' | 'MERGED' | 'IMPORT';
  timestamp: string;
  performedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  details: string;
  previousState?: Partial<LectureSession>;
  newState?: Partial<LectureSession>;
}

export interface ConflictIssue {
  code: 
    | 'ROOM_OVERLAP' 
    | 'LECTURER_OVERLAP' 
    | 'GROUP_OVERLAP' 
    | 'CAPACITY_EXCEEDED' 
    | 'INVALID_TIME_RANGE' 
    | 'MERGED_CONSISTENCY';
  severity: 'ERROR' | 'WARNING';
  message: string;
  conflictingSessionId?: string;
  conflictingCourseCodes?: string[];
  conflictingEntityName?: string;
  suggestedAction?: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  issues: ConflictIssue[];
}

export interface FreePeriodSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'NATURAL_FREE_GAP' | 'FREED_BY_CANCELLATION' | 'WHOLE_DAY_FREE';
  note?: string;
  cancelledSession?: LectureSession;
}

export interface CsvImportRow {
  courseCode: string;
  courseTitle?: string;
  departmentCode: string;
  lecturerName: string;
  studentGroupCode: string;
  groupPopulation?: string | number;
  day: string;
  startTime: string;
  endTime: string;
  classroomName: string;
  roomCapacity?: string | number;
  isMerged?: string | boolean;
  mergedTag?: string;
  [key: string]: unknown;
}

export interface CsvColumnMapping {
  courseCode: string;
  courseTitle: string;
  departmentCode: string;
  lecturerName: string;
  studentGroupCode: string;
  groupPopulation: string;
  day: string;
  startTime: string;
  endTime: string;
  classroomName: string;
  roomCapacity: string;
  mergedTag: string;
}

export interface CsvValidationItem {
  rowIndex: number;
  data: Partial<CsvImportRow>;
  status: 'VALID' | 'WARNING' | 'ERROR';
  messages: string[];
}
