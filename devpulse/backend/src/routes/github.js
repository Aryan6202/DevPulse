const express = require('express');
const fetch = require('node-fetch');
const UserProfile = require('../models/UserProfile');

const router = express.Router();

// GET /api/github/:username/repos - latest public repos, sorted by last update
router.get('/:username/repos', async (req, res) => {
  const { username } = req.params;

  try {
    // Check if user is Pro
    const dbUser = await UserProfile.findOne({
      githubUsername: new RegExp(`^${username.trim()}$`, 'i'),
    });
    const isPro = dbUser && dbUser.subscriptionTier === 'pro';
    const limit = isPro ? 10 : 5;

    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Pro users get detailed stats aggregated over 30 repos, Free gets 5 repos
    const perPage = isPro ? 30 : 5;
    const url = `https://api.github.com/users/${encodeURIComponent(
      username.trim()
    )}/repos?sort=updated&per_page=${perPage}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ message: `GitHub user '${username}' not found` });
      }
      if (response.status === 403) {
        return res.status(429).json({ message: 'GitHub API rate limit exceeded, try again later' });
      }
      return res.status(response.status).json({ message: 'GitHub API request failed' });
    }

    const repos = await response.json();

    // Calculate language stats for Pro users
    let languageStats = {};
    if (isPro && Array.isArray(repos)) {
      repos.forEach((r) => {
        if (r.language) {
          languageStats[r.language] = (languageStats[r.language] || 0) + 1;
        }
      });
    }

    const simplified = (Array.isArray(repos) ? repos : [])
      .slice(0, limit)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        language: r.language,
        updatedAt: r.updated_at,
      }));

    res.json({
      repos: simplified,
      isPro,
      languageStats: isPro ? languageStats : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching GitHub repos' });
  }
});

module.exports = router;
