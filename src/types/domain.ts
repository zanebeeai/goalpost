export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type IdeaStatus = "active" | "archived" | "done";
export type GoalStatus = "active" | "waiting" | "done";
export type ListRole = "owner" | "editor" | "viewer";
export type InvitationStatus = "pending" | "accepted" | "declined";
export type ModerationState = "visible" | "hidden" | "removed";
export type GoalEventType =
  "delivery" | "deadline" | "milestone" | "resume" | "custom";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  timezone: string;
  createdAt: string;
}

export interface ListSummary {
  id: string;
  title: string;
  description: string | null;
  role: ListRole;
  ideaCount: number;
  updatedAt: string;
}

export interface IdeaCard {
  id: string;
  listId: string;
  listTitle?: string;
  title: string;
  content: Json;
  status: IdeaStatus;
  tags: string[];
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  archivedAt: string | null;
  checklistTotal?: number;
  checklistDone?: number;
  attachmentCount?: number;
  commentCount?: number;
}

export interface GoalCollaborator {
  userId: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  isAdmin: boolean;
}

export interface Goalpost {
  id: string;
  publicId: string;
  title: string;
  content: Json;
  status: GoalStatus;
  tags: string[];
  startedOn: string;
  completedAt: string | null;
  parentGoalpostId: string | null;
  createdBy: string | null;
  adminUserId: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: GoalCollaborator[];
  taskTotal?: number;
  taskDone?: number;
  latestUpdate?: GoalUpdate;
}

export interface GoalUpdate {
  id: string;
  goalpostId: string;
  authorId: string | null;
  authorName: string;
  content: Json;
  publishedAt: string;
}

export interface GoalTask {
  id: string;
  goalpostId: string;
  title: string;
  assigneeUserId: string | null;
  dueAt: string | null;
  completedAt: string | null;
  position: number;
}

export interface GoalEvent {
  id: string;
  goalpostId: string;
  title: string;
  description: string | null;
  eventType: GoalEventType;
  startsAt: string;
  createdBy: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}
