const express = require('express');
const crypto = require('crypto');
const Team = require('../models/Team');
const UserProfile = require('../models/UserProfile');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to generate a random 8-character invite code
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// POST /api/team/create - Create a new team
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Check if user already has a team
    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    if (user.teamId) {
      return res.status(400).json({ message: 'You are already in a team. Leave your current team first.' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let existingTeam = await Team.findOne({ inviteCode });
    while (existingTeam) {
      inviteCode = generateInviteCode();
      existingTeam = await Team.findOne({ inviteCode });
    }

    // Create the team
    const team = await Team.create({
      name: name.trim(),
      inviteCode,
      owner: req.user.id,
    });

    // Update user's profile
    user.teamId = team._id;
    user.role = 'owner';
    await user.save();

    res.status(201).json({
      team,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        githubUsername: user.githubUsername,
        bio: user.bio,
        skills: user.skills,
        subscriptionTier: user.subscriptionTier,
        teamId: user.teamId,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating team' });
  }
});

// POST /api/team/join - Join a team using an invite code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code. Team not found.' });
    }

    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    if (user.teamId) {
      return res.status(400).json({ message: 'You are already in a team. Leave your current team first.' });
    }

    // Join team as member
    user.teamId = team._id;
    user.role = 'member';
    await user.save();

    res.json({
      team,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        githubUsername: user.githubUsername,
        bio: user.bio,
        skills: user.skills,
        subscriptionTier: user.subscriptionTier,
        teamId: user.teamId,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining team' });
  }
});

// GET /api/team/details - Fetch team details and its members
router.get('/details', requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    if (!user.teamId) {
      return res.status(404).json({ message: 'You are not part of any team.' });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      // Clear orphan teamId if team was deleted
      user.teamId = null;
      user.role = 'member';
      await user.save();
      return res.status(404).json({ message: 'Team not found or has been disbanded.' });
    }

    // Find all users in this team
    const members = await UserProfile.find({ teamId: team._id }).select('username email role skills githubUsername');

    res.json({
      team,
      members,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching team details' });
  }
});

// POST /api/team/leave - Leave or disband team
router.post('/leave', requireAuth, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user || !user.teamId) {
      return res.status(400).json({ message: 'You are not in a team.' });
    }

    const teamId = user.teamId;

    if (user.role === 'owner') {
      // Owner leaves: Disband the team (delete team and remove teamId from all members)
      await Team.findByIdAndDelete(teamId);
      await UserProfile.updateMany(
        { teamId },
        { $set: { teamId: null, role: 'member' } }
      );
      res.json({ message: 'Team disbanded successfully.' });
    } else {
      // Regular member leaves
      user.teamId = null;
      user.role = 'member';
      await user.save();
      res.json({ message: 'Left the team successfully.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error leaving team' });
  }
});

module.exports = router;
