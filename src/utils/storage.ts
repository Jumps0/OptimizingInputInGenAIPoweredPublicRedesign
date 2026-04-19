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

const readStoredJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Invalid JSON in localStorage for key "${key}". Resetting to fallback.`, error);
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

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
  return readStoredJson<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
};

type UsersApiResponse = {
  users?: User[];
  source?: 'blob' | 'empty';
  error?: string;
};

type UserMutationPayload =
  | { operation: 'upsert'; user: User }
  | { operation: 'remove'; userId: number; username?: string }
  | { operation: 'rename'; userId: number; newUsername: string };

const mutateUsersInBlob = async (payload: UserMutationPayload): Promise<User[]> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive: true,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as UsersApiResponse | null;
    throw new Error(errorBody?.error || 'Failed to sync users to blob storage');
  }

  const data = (await response.json()) as UsersApiResponse;
  return Array.isArray(data.users) ? data.users : [];
};

export const fetchUsersWithFallback = async (): Promise<User[]> => {
  const localUsers = getStoredUsers();

  try {
    const response = await fetch(`/api/users?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Users blob endpoint returned non-OK status');
    }

    const data = (await response.json()) as UsersApiResponse;
    const blobUsers = Array.isArray(data.users) ? data.users : [];

    // Guard against accidental local clobbering when blob is temporarily empty.
    if (data.source === 'empty' && localUsers.length > 0) {
      return localUsers;
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(blobUsers));
    return blobUsers;
  } catch {
    return localUsers;
  }
};

export const getStoredProjects = (): Project[] => {
  return readStoredJson<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
};

export const getStoredHistory = (): EditHistory[] => {
  return readStoredJson<EditHistory[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
};

export const getCurrentUser = (): User | null => {
  return readStoredJson<User | null>(STORAGE_KEYS.CURRENT_USER, null);
};

export const getStoredResponses = (): PostStudyResponse[] => {
  return readStoredJson<PostStudyResponse[]>(STORAGE_KEYS.RESPONSES, INITIAL_RESPONSES);
};

export const getStoredResultFeedbacks = (): ResultFeedback[] => {
  return readStoredJson<ResultFeedback[]>(STORAGE_KEYS.RESULT_FEEDBACK, INITIAL_RESULT_FEEDBACK);
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

export const addUser = async (user: User): Promise<void> => { // Add new user to storage
  const syncedUsers = await mutateUsersInBlob({
    operation: 'upsert',
    user,
  });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(syncedUsers));
};

export const removeUser = async (user: User): Promise<void> => { // Remove user and associated data
  const syncedUsers = await mutateUsersInBlob({
    operation: 'remove',
    userId: user.id,
    username: user.username,
  });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(syncedUsers));
};

export const renameUser = async (user: User, newName: string): Promise<void> => { // Rename specified user
  const normalizedName = newName.trim().toLowerCase();
  if (!normalizedName) {
    return;
  }

  const syncedUsers = await mutateUsersInBlob({
    operation: 'rename',
    userId: user.id,
    newUsername: normalizedName,
  });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(syncedUsers));
};

export const createNewUser = async (username: string, method: string, isAdminUser: boolean): Promise<User> => {
  if(username.length === 0) {username = `citizen${Date.now()}`;} // Fallback name if empty

  const newUser: User = {
        id: Date.now(),
        username: username.trim().toLowerCase(),
        assignedMethod: pickSpecificAssignedMethod(Number(method)),
        role: isAdminUser ? 'admin' : 'user',
  };

  console.log(method, Number(method), newUser.assignedMethod);

  await addUser(newUser);
  return newUser;
};

export const savePostStudyResponse = async (
  userId: number,
  responses: Record<string, string>
): Promise<PostStudyResponse> => {
  const newResponse: PostStudyResponse = {
    id: Date.now(),
    userId,
    createdAt: new Date().toISOString(),
    responses,
  };

  const response = await fetch('/api/post-study-responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newResponse),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Failed to save post-study response to blob storage');
  }

  return newResponse;
};

export const fetchPostStudyResponses = async (): Promise<PostStudyResponse[]> => {
  try {
    const response = await fetch(`/api/post-study-responses?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Post-study blob endpoint returned non-OK status');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error('Post-study blob endpoint returned a non-JSON response');
    }

    const data = (await response.json()) as { responses?: PostStudyResponse[] };
    return Array.isArray(data.responses) ? data.responses : [];
  } catch {
    return getStoredResponses();
  }
};

export const deletePostStudyResponseItem = async (id: number, blobPath?: string): Promise<void> => {
  const local = getStoredResponses();
  const next = local.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(next));

  try {
    const response = await fetch('/api/post-study-responses', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, blobPath }),
    });

    if (!response.ok) {
      throw new Error('Post-study delete endpoint returned non-OK status');
    }
  } catch (error) {
    console.warn('Failed to delete post-study item from blob. Local deletion succeeded.', error);
  }
};

export const fetchPromptHistories = async (): Promise<EditHistory[]> => {
  const localHistory = getStoredHistory();

  try {
    const response = await fetch(`/api/prompt-history?_=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Prompt-history blob endpoint returned non-OK status');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error('Prompt-history blob endpoint returned a non-JSON response');
    }

    const data = (await response.json()) as { history?: EditHistory[] };
    const history = Array.isArray(data.history) ? data.history : [];

    if (history.length === 0 && localHistory.length > 0) {
      return localHistory;
    }

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return history;
  } catch {
    return localHistory;
  }
};

export const deletePromptHistoryItem = async (id: number, blobPath?: string): Promise<void> => {
  const local = getStoredHistory();
  const next = local.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));

  try {
    const response = await fetch('/api/prompt-history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, blobPath }),
    });

    if (!response.ok) {
      throw new Error('Prompt-history delete endpoint returned non-OK status');
    }
  } catch (error) {
    console.warn('Failed to delete prompt-history item from blob. Local deletion succeeded.', error);
  }
};

const savePromptHistoryEntry = async (entry: EditHistory): Promise<void> => {
  const remotePayload = await toRemotePromptHistoryPayload(entry);
  const response = await fetch('/api/prompt-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(remotePayload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error || 'Failed to save prompt history to blob storage');
  }
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

const toHistoryImageData = async (imageUrl: string, maxWidth = 640, quality = 0.5): Promise<string> => {
  if (!imageUrl) {
    return imageUrl;
  }

  try {
    return await compressImage(imageUrl, maxWidth, quality);
  } catch (e) {
    console.warn('Failed to compress history image, falling back to reusable data URL.', e);
    return fetchImageAsDataUrl(imageUrl);
  }
};

const toRemotePromptHistoryPayload = async (entry: EditHistory): Promise<EditHistory> => {
  const availableOutputImages = Array.isArray(entry.outputImages) ? entry.outputImages.filter(Boolean) : [];
  const selectedIndex = Number.isFinite(entry.selectedOutputIndex)
    ? Math.max(0, Math.min(Number(entry.selectedOutputIndex), Math.max(availableOutputImages.length - 1, 0)))
    : 0;
  const compressedInputImage = await toHistoryImageData(entry.inputImage, 640, 0.5);
  const compressedOutputImages = availableOutputImages.length > 0
    ? await Promise.all(availableOutputImages.map((imageUrl) => toHistoryImageData(imageUrl, 480, 0.45)))
    : [];
  const compressedSelectedOutputImage =
    compressedOutputImages[selectedIndex] ||
    (entry.outputImage ? await toHistoryImageData(entry.outputImage, 480, 0.45) : '');

  return {
    ...entry,
    inputImage: compressedInputImage,
    outputImage: compressedSelectedOutputImage,
    outputImages: compressedOutputImages.length > 0 ? compressedOutputImages : undefined,
    selectedOutputIndex: compressedOutputImages.length > 0 ? selectedIndex : 0,
  };
};

export const saveNewGeneration = async (
  userId: number,
  username: string,
  prompt: string,
  inputImage: string,
  outputImage: string,
  options?: {
    baseHistoryId?: number | null;
    allOutputImages?: string[];
    selectedOutputIndex?: number;
  }
): Promise<EditHistory> => {
  const projects = getStoredProjects();
  const history = getStoredHistory();
  const normalizedUsername = username.trim() || `User #${userId}`;
  const baseHistoryId = options?.baseHistoryId ?? null;
  const baseHistory =
    Number.isFinite(baseHistoryId) && baseHistoryId !== null
      ? history.find((h) => h.id === baseHistoryId && h.userId === userId)
      : undefined;

  // Compress images before storage
  // Use a max width of 800px and 0.6 quality to keep size small
  const persistentProjectInputImage = await toPersistentImageData(inputImage);
  const persistentHistoryInputImage = await toHistoryImageData(inputImage, 640, 0.5);
  const normalizedOutputImages = Array.isArray(options?.allOutputImages) && options?.allOutputImages.length > 0
    ? options.allOutputImages
    : [outputImage];
  const persistentOutputImages = await Promise.all(
    normalizedOutputImages.map((img) => toHistoryImageData(img, 480, 0.45))
  );
  const selectedOutputIndex = Number.isFinite(options?.selectedOutputIndex)
    ? Math.max(0, Math.min(Number(options?.selectedOutputIndex), persistentOutputImages.length - 1))
    : 0;
  const selectedOutputImage =
    persistentOutputImages[selectedOutputIndex] ||
    (outputImage ? await toHistoryImageData(outputImage, 480, 0.45) : '');

  let projectId: number;
  let version = 1;

  if (baseHistory) {
    projectId = baseHistory.projectId;
    version = (Number(baseHistory.version) || 1) + 1;
  } else {
    // Create a new project for a brand new editing chain.
    projectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;

    const newProject: Project = {
      id: projectId,
      userId,
      originalImage: persistentProjectInputImage,
      createdAt: new Date().toISOString()
    };

    // Save project with safety check
    projects.push(newProject);
    try {
      safelySetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.warn('Failed to persist project locally. Continuing with blob save.', error);
    }
  }

  // Create history item
  const newHistoryId = history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1;
  
  const newHistoryItem: EditHistory = {
    id: newHistoryId,
    projectId,
    userId,
    username: normalizedUsername,
    prompt,
    inputImage: persistentHistoryInputImage,
    outputImage: selectedOutputImage,
    outputImages: persistentOutputImages.length > 0 ? persistentOutputImages : undefined,
    selectedOutputIndex,
    version,
    timestamp: new Date().toISOString(),
  };

  // Save history with safety check
  history.push(newHistoryItem);
  try {
    safelySetItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to persist prompt history locally. Continuing with blob save.', error);
  }

  await savePromptHistoryEntry(newHistoryItem);
  
  return newHistoryItem;
};
