export interface User {
  id: number;
  username: string;
  avatar?: string;
  assignedMethod: 'text' | 'voice' | 'inpainting' | 'dragdrop';
  role: 'user' | 'admin';
}

export interface Project {
  id: number;
  userId: number;
  originalImage: string;
  createdAt: string;
}

export interface EditHistory {
  id: number;
  projectId: number;
  userId: number;
  username: string;
  prompt: string;
  inputImage: string;
  outputImage: string;
  outputImages?: string[];
  selectedOutputIndex?: number;
  version: number;
  timestamp: string;
  isTemporary?: boolean;
  serverRecordKey?: string;
  blobPath?: string;
}

export interface PostStudyResponse {
  id: number;
  userId: number;
  createdAt: string;
  responses: Record<string, string>;
  blobPath?: string;
}

import {
  getStoredProjects,
  getStoredHistory,
  getStoredResultFeedbacks,
  fetchUsersWithFallback,
} from './storage';

export const fetchUsers = async (): Promise<User[]> => {
  return fetchUsersWithFallback();
};

export const fetchProjects = async (): Promise<Project[]> => {
  return getStoredProjects();
};

export const fetchEditHistory = async (): Promise<EditHistory[]> => {
  return getStoredHistory().filter((item) => !item.isTemporary);
};

export const fetchResultFeedbacks = async () => {
  return getStoredResultFeedbacks();
};

export const getProjectById = async (id: number): Promise<Project | undefined> => {
  const projects = await fetchProjects();
  return projects.find(p => p.id === id);
};

export const getUserById = async (id: number): Promise<User | undefined> => {
  const users = await fetchUsers();
  return users.find(u => u.id === id);
};

export const getHistoryByProjectId = async (projectId: number): Promise<EditHistory[]> => {
  const history = await fetchEditHistory();
  return history.filter(h => h.projectId === projectId);
};
