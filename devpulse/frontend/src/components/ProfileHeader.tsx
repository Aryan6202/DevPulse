import type { UserProfile } from '../types';
import '../styles/ProfileHeader.css';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = profile.username.slice(0, 2).toUpperCase();

  return (
    <header className="profile-header">
      <div className="profile-header__avatar" aria-hidden="true">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${profile.username} avatar`}
            loading="lazy"
            width={72}
            height={72}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="profile-header__info">
        <h1>{profile.username}</h1>
        <p className="profile-header__bio">{profile.bio || 'No bio yet.'}</p>
        {profile.githubUsername && (
          <a
            className="profile-header__github-link"
            href={`https://github.com/${profile.githubUsername}`}
            target="_blank"
            rel="noreferrer"
          >
            @{profile.githubUsername} on GitHub
          </a>
        )}
      </div>
    </header>
  );
}
