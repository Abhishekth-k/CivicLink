export type UserRole = "CITIZEN" | "SOCIAL_WORKER" | "MANAGER" | "SUPER_ADMIN";

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isSuspended: boolean;
  points?: number;
  department?: string;
  assignedRegion?: string;
  status?: string;
  rating?: number;
  avatar?: string;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "SUBMITTED" | "REVIEWED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "APPROVED";
  latitude: number;
  longitude: number;
  address: string;
  citizenId: number;
  assignedWorkerId: number | null;
  aiSeverity?: string;
  aiDepartment?: string;
  aiSummary?: string;
  aiSolution?: string;
  isDuplicate: boolean;
  images: string[];
  beforeImage: string | null;
  afterImage: string | null;
  workerStatement?: string;
  createdAt: string;
  resolvedAt: string | null;
  imageVerification?: {
    isRelevant: boolean;
    relevanceScore: number;
    reasoning: string;
    detectedObjects: string[];
  } | null;
}

export interface Message {
  id: number;
  reportId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WeatherInfo {
  temp: number;
  humidity: number;
  rain: number;
  windSpeed: number;
  condition: string;
}

export interface SystemSettings {
  enableAiClustering: string;
  autoRoutingEnabled: string;
  severityThreshold: string;
  alertContacts: string;
}

export interface Complaint {
  id: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  taggedUserId: number | null;
  taggedUserName: string;
  message: string;
  aiResponse: string;
  createdAt: string;
}
