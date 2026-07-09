import { useEffect, useState } from 'react';
import type { GitHubRepo } from '../types';
import { api } from '../api/client';
import LanguageChart from './LanguageChart';
import '../styles/GitHubFeed.css';

interface GitHubFeedProps {
  githubUsername: string;
}

export default function GitHubFeed({ githubUsername }: GitHubFeedProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [languageStats, setLanguageStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchRepos() {
      if (!githubUsername) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const responseData = await api.getGitHubRepos(githubUsername);
        if (!cancelled) {
          setRepos(responseData.repos || []);
          setIsPro(responseData.isPro || false);
          setLanguageStats(responseData.languageStats || null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load repos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRepos();
    return () => {
      cancelled = true;
    };
  }, [githubUsername]);

  if (!githubUsername) {
    return <p className="github-feed__empty">Add a GitHub username to your profile to see recent activity.</p>;
  }

  if (loading) return <p className="github-feed__status">Loading latest repositories…</p>;
  if (error) return <p className="github-feed__status github-feed__status--error">{error}</p>;
  if (repos.length === 0) return <p className="github-feed__status">No public repositories found.</p>;

  // Filter repositories based on search query
  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="github-feed-section" aria-label="GitHub integration section">
      {/* SaaS Language Chart - Pro Feature */}
      {isPro && languageStats && <LanguageChart stats={languageStats} />}

      {/* Repo Feed Header & Filter */}
      <div className="github-feed-header-group">
        <h3>
          Recent Repositories ({isPro ? 'Pro Feed: Limit 10' : 'Free Feed: Limit 5'})
        </h3>
        <input
          type="text"
          placeholder="Filter repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="repo-search-input"
        />
      </div>

      {filteredRepos.length === 0 ? (
        <p className="github-feed__status">No matching repositories found.</p>
      ) : (
        <div className="github-feed" aria-label="Recent GitHub repositories">
          {filteredRepos.map((repo) => (
            <a className="github-feed__card" key={repo.name} href={repo.url} target="_blank" rel="noreferrer">
              <h4>{repo.name}</h4>
              <p>{repo.description || 'No description provided.'}</p>
              <div className="github-feed__meta">
                {repo.language && <span>{repo.language}</span>}
                <span>★ {repo.stars}</span>
                <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
