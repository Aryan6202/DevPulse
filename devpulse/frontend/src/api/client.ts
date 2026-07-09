import type { AuthResponse, GitHubResponse, Skill, UserProfile, TeamDetails } from '../types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message || 'Request failed');
  }

  return data as T;
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  register: (payload: { username: string; email: string; password: string; githubUsername?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  getMyProfile: (token: string) =>
    request<UserProfile>('/profile/me/data', { headers: authHeader(token) }),

  updateMyProfile: (
    token: string,
    payload: { bio?: string; skills?: Skill[]; githubUsername?: string; avatarUrl?: string }
  ) =>
    request<UserProfile>('/profile/me/data', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify(payload),
    }),

  upgradePlan: (token: string) =>
    request<UserProfile>('/profile/upgrade', {
      method: 'POST',
      headers: authHeader(token),
    }),

  createTeam: (token: string, name: string) =>
    request<{ team: any; user: UserProfile }>('/team/create', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ name }),
    }),

  joinTeam: (token: string, inviteCode: string) =>
    request<{ team: any; user: UserProfile }>('/team/join', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ inviteCode }),
    }),

  getTeamDetails: (token: string) =>
    request<TeamDetails>('/team/details', {
      headers: authHeader(token),
    }),

  leaveTeam: (token: string) =>
    request<{ message: string }>('/team/leave', {
      method: 'POST',
      headers: authHeader(token),
    }),

  getGitHubRepos: (username: string) =>
    request<GitHubResponse>(`/github/${encodeURIComponent(username)}/repos`),
};
