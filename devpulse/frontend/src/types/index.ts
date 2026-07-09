export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  name: string;
  level: SkillLevel;
  progress: number; // 0-100
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  githubUsername: string;
  bio: string;
  skills: Skill[];
  avatarUrl: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'inactive';
  teamId: string | null;
  role: 'owner' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  updatedAt: string;
}

export interface GitHubResponse {
  repos: GitHubRepo[];
  isPro: boolean;
  languageStats: Record<string, number> | null;
}

export type AuthUser = Pick<
  UserProfile,
  '_id' | 'username' | 'email' | 'githubUsername' | 'bio' | 'skills' | 'subscriptionTier' | 'subscriptionStatus' | 'teamId' | 'role'
>;

export interface Team {
  _id: string;
  name: string;
  inviteCode: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  username: string;
  email: string;
  role: 'owner' | 'member';
  skills: Skill[];
  githubUsername: string;
}

export interface TeamDetails {
  team: Team;
  members: TeamMember[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiError {
  message: string;
}
