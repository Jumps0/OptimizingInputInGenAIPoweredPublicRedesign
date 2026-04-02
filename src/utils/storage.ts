import { pickSpecificAssignedMethod } from './constants';
import type { User, Project, EditHistory, PostStudyResponse } from './dummyData';

/** User-submitted feedback when declining “OK” on a generation result (stored locally). */
export interface ResultFeedback {
  id: number;
  userId: number;
  historyId: number | null;
  round: number;
  prompt: string;
  message: string;
  createdAt: string;
}
import { compressImage, fetchImageAsDataUrl } from './imageUtils';

const STORAGE_KEYS = {
  USERS: 'citizen_redesign_users_v3',
  PROJECTS: 'citizen_redesign_projects_v3',
  HISTORY: 'citizen_redesign_history_v3',
  CURRENT_USER: 'citizen_redesign_current_user_v3',
  RESPONSES: 'citizen_redesign_post_study_responses_v1',
  RESULT_FEEDBACK: 'citizen_redesign_result_feedback_v1',
};

// Initial data with corrected image paths
const INITIAL_USERS: User[] = [];

const INITIAL_PROJECTS: Project[] = [];

const INITIAL_HISTORY: EditHistory[] = [];
const INITIAL_RESPONSES: PostStudyResponse[] = [];
const INITIAL_RESULT_FEEDBACK: ResultFeedback[] = [];

export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESPONSES)) {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(INITIAL_RESPONSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESULT_FEEDBACK)) {
    localStorage.setItem(STORAGE_KEYS.RESULT_FEEDBACK, JSON.stringify(INITIAL_RESULT_FEEDBACK));
  }
};

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : INITIAL_USERS;
};

export const getStoredProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : INITIAL_PROJECTS;
};

export const getStoredHistory = (): EditHistory[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return data ? JSON.parse(data) : INITIAL_HISTORY;
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const getStoredResponses = (): PostStudyResponse[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
  return data ? JSON.parse(data) : INITIAL_RESPONSES;
};

export const getStoredResultFeedbacks = (): ResultFeedback[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RESULT_FEEDBACK);
  return data ? JSON.parse(data) : INITIAL_RESULT_FEEDBACK;
};

export const addResultFeedback = (entry: {
  userId: number;
  historyId: number | null;
  round: number;
  prompt: string;
  message: string;
}): ResultFeedback => {
  const list = getStoredResultFeedbacks();
  const id = list.length > 0 ? Math.max(...list.map((f) => f.id)) + 1 : 1;
  const row: ResultFeedback = {
    id,
    userId: entry.userId,
    historyId: entry.historyId,
    round: entry.round,
    prompt: entry.prompt,
    message: entry.message.trim(),
    createdAt: new Date().toISOString(),
  };
  list.push(row);
  localStorage.setItem(STORAGE_KEYS.RESULT_FEEDBACK, JSON.stringify(list));
  return row;
};

export const setCurrentUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const addProject = (project: Project) => {
  const projects = getStoredProjects();
  projects.push(project);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const addHistoryItem = (item: EditHistory) => {
  const history = getStoredHistory();
  history.push(item);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const addUser = (user: User) => { // Add new user to storage
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const removeUser = (user: User) => { // Remove user and associated data
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    users.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

export const renameUser = (user: User, newName: string) => { // Rename specified user
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    users[index].username = newName;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

export const createNewUser = (username: string, method: string, isAdminUser: boolean) => {
  if(username.length === 0) {username = `citizen${Date.now()}`;} // Fallback name if empty

  const newUser: User = {
        id: Date.now(),
        username: username.trim().toLowerCase(),
        assignedMethod: pickSpecificAssignedMethod(Number(method)),
        role: isAdminUser ? 'admin' : 'user',
  };

  console.log(method, Number(method), newUser.assignedMethod);

  addUser(newUser);
};

export const savePostStudyResponse = (
  userId: number,
  responses: Record<string, string>
): PostStudyResponse => {
  const existing = getStoredResponses();
  const newResponse: PostStudyResponse = {
    id: Date.now(),
    userId,
    createdAt: new Date().toISOString(),
    responses,
  };
  existing.push(newResponse);
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(existing));
  return newResponse;
};

const safelySetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn("Storage quota exceeded. Attempting to clear old data...");
      
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Get current history and projects
        const history = getStoredHistory();
        const projects = getStoredProjects();
        
        if (history.length === 0 && projects.length === 0) {
          console.error("Storage full and no items to remove.");
          throw e; // Can't clear anything
        }

        // Remove oldest 30% of history items (more aggressive)
        const removeCount = Math.max(1, Math.floor(history.length * 0.3));
        const newHistory = history.slice(removeCount);
        
        // Keep strictly the last 15 projects
        const newProjects = projects.slice(Math.max(0, projects.length - 15));

        try {
          // Try saving the reduced lists first
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
          
          // Now try setting the original item again
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.warn(`Retry attempt ${attempts} failed. Trying to remove more data...`);
          if (attempts === maxAttempts) {
             console.error("Failed to save even after multiple attempts to clear data:", retryError);
             throw retryError;
          }
          // Continue loop to remove more
        }
      }
    }
    throw e;
  }
};

const toPersistentImageData = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) {
    return imageUrl;
  }

  try {
    return await compressImage(imageUrl, 800, 0.6);
  } catch (e) {
    console.warn('Failed to compress image, falling back to raw data URL.', e);
    return fetchImageAsDataUrl(imageUrl);
  }
};

export const saveNewGeneration = async (
  userId: number,
  prompt: string,
  inputImage: string,
  outputImage: string
): Promise<EditHistory> => {
  const projects = getStoredProjects();
  const history = getStoredHistory();

  // Compress images before storage
  // Use a max width of 800px and 0.6 quality to keep size small
  const persistentInputImage = await toPersistentImageData(inputImage);
  
  const persistentOutputImage = await toPersistentImageData(outputImage);

  // Create a new project for this generation
  const newProjectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
  
  const newProject: Project = {
    id: newProjectId,
    userId,
    originalImage: persistentInputImage,
    createdAt: new Date().toISOString()
  };
  
  // Save project with safety check
  projects.push(newProject);
  safelySetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

  // Create history item
  const newHistoryId = history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1;
  
  const newHistoryItem: EditHistory = {
    id: newHistoryId,
    projectId: newProjectId,
    userId,
    prompt,
    inputImage: persistentInputImage,
    outputImage: persistentOutputImage,
    version: 1,
    timestamp: new Date().toISOString(),
    likes: [],
    comments: []
  };

  // Save history with safety check
  history.push(newHistoryItem);
  safelySetItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  
  return newHistoryItem;
};

export const toggleLike = (historyId: number, userId: number) => {
  const history = getStoredHistory();
  const itemIndex = history.findIndex(h => h.id === historyId);
  
  if (itemIndex !== -1) {
    const item = history[itemIndex];
    if (!item.likes) item.likes = []; // Ensure array exists
    
    if (item.likes.includes(userId)) {
      item.likes = item.likes.filter(id => id !== userId);
    } else {
      item.likes.push(userId);
    }
    
    history[itemIndex] = item;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return item.likes; // Return updated likes
  }
  return [];
};

export const addComment = (historyId: number, userId: number, text: string) => {
  const history = getStoredHistory();
  const itemIndex = history.findIndex(h => h.id === historyId);
  
  if (itemIndex !== -1) {
    const item = history[itemIndex];
    if (!item.comments) item.comments = []; // Ensure array exists
    
    const newComment = {
      id: Date.now(),
      userId,
      text,
      timestamp: new Date().toISOString()
    };
    
    item.comments.push(newComment);
    history[itemIndex] = item;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return item.comments; // Return updated comments
  }
  return [];
};
