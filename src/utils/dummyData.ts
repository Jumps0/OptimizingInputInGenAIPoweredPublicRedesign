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

export interface Comment {
  id: number;
  userId: number;
  text: string;
  timestamp: string;
}

export interface EditHistory {
  id: number;
  projectId: number;
  userId: number;
  prompt: string;
  inputImage: string;
  outputImage: string;
  version: number;
  timestamp: string;
  likes: number[]; // Array of user IDs who liked
  comments: Comment[];
}

export interface PostStudyResponse {
  id: number;
  userId: number;
  createdAt: string;
  responses: Record<string, string>;
}

import {
  getStoredUsers,
  getStoredProjects,
  getStoredHistory,
  getStoredResultFeedbacks,
} from './storage';

export const fetchUsers = async (): Promise<User[]> => {
  return getStoredUsers();
};

export const fetchProjects = async (): Promise<Project[]> => {
  return getStoredProjects();
};

export const fetchEditHistory = async (): Promise<EditHistory[]> => {
  return getStoredHistory();
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
