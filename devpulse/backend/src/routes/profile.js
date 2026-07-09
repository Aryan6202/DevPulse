const express = require('express');
const UserProfile = require('../models/UserProfile');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile/:username - public profile lookup
router.get('/:username', async (req, res) => {
  try {
    const user = await UserProfile.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Profile not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// GET /api/profile/me/data - current authenticated user's profile
router.get('/me/data', requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Profile not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// POST /api/profile/me/data - create/update bio + skills for authenticated user
router.post('/me/data', requireAuth, async (req, res) => {
  try {
    const { bio, skills, githubUsername, avatarUrl } = req.body;

    const user = await UserProfile.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Profile not found' });

    const update = {};
    if (typeof bio === 'string') update.bio = bio.slice(0, 300);
    if (typeof githubUsername === 'string') update.githubUsername = githubUsername;
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;

    if (Array.isArray(skills)) {
      if (user.subscriptionTier === 'free' && skills.length > 10) {
        return res.status(403).json({
          message: 'Free tier is limited to a maximum of 10 skills. Upgrade to Pro for unlimited skills!',
        });
      }
      update.skills = skills;
    }

    Object.assign(user, update);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Unable to update profile' });
  }
});

// POST /api/profile/upgrade - Upgrade user subscription to Pro
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Profile not found' });

    user.subscriptionTier = 'pro';
    user.subscriptionStatus = 'active';
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during upgrade' });
  }
});

module.exports = router;
