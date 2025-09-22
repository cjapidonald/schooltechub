export type ClassStatus = "active" | "completed" | "upcoming" | "archived";

export interface Class {
  id: string;
  /** Human friendly title for the class. */
  title: string;
  /** Optional short summary or description of the class. */
  summary: string | null;
  /** Subject focus for the class (e.g. "Math"). */
  subject: string | null;
  /** Stage or level targeted by the class (e.g. "Middle School"). */
  stage: string | null;
  /** Current lifecycle status of the class. */
  status: ClassStatus | null;
  /** ISO8601 start date for the class, if scheduled. */
  startDate: string | null;
  /** ISO8601 end date for the class, if scheduled. */
  endDate: string | null;
  /** Meeting schedule description provided by the educator. */
  meetingSchedule: string | null;
  /** Optional virtual meeting link for the class. */
  meetingLink: string | null;
  /** URL to a representative image. */
  imageUrl: string | null;
  /** Number of learners currently enrolled. */
  currentEnrollment: number | null;
  /** Maximum seats available. */
  maxCapacity: number | null;
  /** Owning educator account identifier. */
  ownerId: string | null;
  /** Record creation timestamp. */
  createdAt: string | null;
  /** Record update timestamp. */
  updatedAt: string | null;
}

export interface LessonPlan {
  id: string;
  ownerId: string;
  title: string;
  /** Optional ISO date string for when the lesson will run. */
  date: string | null;
  /** Free form duration text (e.g. "45 minutes"). */
  duration: string | null;
  /** How learners are grouped (e.g. "Pairs"). */
  grouping: string | null;
  /** Delivery mode (e.g. "in-person", "virtual"). */
  deliveryMode: string | null;
  /** Optional logo or header image URL. */
  logoUrl: string | null;
  /** Additional structured metadata captured in the builder. */
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LessonStep {
  id: string;
  lessonPlanId: string;
  position: number | null;
  title: string | null;
  notes: string | null;
  /** Identifiers of referenced resources for the step. */
  resourceIds: string[];
}

export type NotificationType =
  | "resource_approved"
  | "blogpost_approved"
  | "research_application_approved"
  | "comment_reply";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface NotificationPrefs {
  userId: string;
  emailEnabled: boolean;
  resourceApproved: boolean;
  blogpostApproved: boolean;
  researchApplicationApproved: boolean;
  commentReply: boolean;
  updatedAt: string;
}

export type ResearchProjectStatus = "draft" | "open" | "closed";
export type ResearchProjectVisibility = "list_public" | "private";

export interface ResearchProject {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  status: ResearchProjectStatus;
  visibility: ResearchProjectVisibility;
  createdBy: string | null;
  createdAt: string;
}

export type ResearchDocumentType =
  | "protocol"
  | "consent"
  | "dataset"
  | "report"
  | "misc";

export type ResearchDocumentStatus = "internal" | "participant" | "public";

export interface ResearchDocument {
  id: string;
  projectId: string;
  title: string | null;
  docType: ResearchDocumentType | null;
  storagePath: string | null;
  status: ResearchDocumentStatus;
  createdAt: string;
}

export type ResearchApplicationStatus = "pending" | "approved" | "rejected";

export interface ResearchApplication {
  id: string;
  projectId: string;
  applicantId: string;
  status: ResearchApplicationStatus;
  statement: string | null;
  submittedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface ResearchParticipant {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: string;
}

export type ResearchSubmissionStatus =
  | "submitted"
  | "accepted"
  | "needs_changes";

export interface ResearchSubmission {
  id: string;
  projectId: string;
  participantId: string;
  title: string | null;
  description: string | null;
  storagePath: string | null;
  status: ResearchSubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
}
