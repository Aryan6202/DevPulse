import { lazy, Suspense, useEffect, useState } from 'react';
import ProfileHeader from './components/ProfileHeader';
import AuthForm from './components/AuthForm';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import type { UserProfile, TeamDetails, SkillLevel } from './types';
import SkillChart from './components/SkillChart';
import './styles/global.css';

const GitHubFeed = lazy(() => import('./components/GitHubFeed'));

export default function App() {
  const { token, user, logout, login } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'team' | 'billing'>('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('devpulse_theme') as 'light' | 'dark') || 'dark';
  });

  // Team states
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);

  // New skill states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Beginner');
  const [newSkillProgress, setNewSkillProgress] = useState(50);
  const [skillError, setSkillError] = useState<string | null>(null);

  // Profile update state
  const [bioInput, setBioInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Billing modal / state
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devpulse_theme', theme);
  }, [theme]);

  // Load user profile
  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    setLoading(true);
    api
      .getMyProfile(token)
      .then((p) => {
        setProfile(p);
        setBioInput(p.bio || '');
        setGithubInput(p.githubUsername || '');
        setAvatarInput(p.avatarUrl || '');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [token]);

  // Load team details if user is part of a team
  useEffect(() => {
    if (!token || !profile?.teamId) {
      setTeamDetails(null);
      return;
    }
    setTeamLoading(true);
    setTeamError(null);
    api
      .getTeamDetails(token)
      .then(setTeamDetails)
      .catch((err) => setTeamError(err instanceof Error ? err.message : 'Failed to load team'))
      .finally(() => setTeamLoading(false));
  }, [token, profile?.teamId]);

  // Handle billing payment check out simulation
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCheckoutLoading(true);
    try {
      // Simulate network lag
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const updatedProfile = await api.upgradePlan(token);
      setProfile(updatedProfile);
      // Sync auth state user object
      if (user) {
        login(token, {
          ...user,
          subscriptionTier: 'pro',
        });
      }
      setCheckoutSuccess(true);
      setTimeout(() => {
        setShowCheckout(false);
        setCheckoutSuccess(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setActiveTab('dashboard');
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Add a skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !profile) return;
    if (!newSkillName.trim()) return;

    setSkillError(null);
    const updatedSkills = [
      ...profile.skills,
      { name: newSkillName.trim(), level: newSkillLevel, progress: Number(newSkillProgress) },
    ];

    try {
      const p = await api.updateMyProfile(token, { skills: updatedSkills });
      setProfile(p);
      setNewSkillName('');
      setNewSkillLevel('Beginner');
      setNewSkillProgress(50);
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : 'Failed to add skill');
    }
  };

  // Remove a skill
  const handleRemoveSkill = async (skillName: string) => {
    if (!token || !profile) return;
    setSkillError(null);
    const updatedSkills = profile.skills.filter((s) => s.name !== skillName);
    try {
      const p = await api.updateMyProfile(token, { skills: updatedSkills });
      setProfile(p);
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : 'Failed to remove skill');
    }
  };

  // Drag and drop profile image handlers
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarInput(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Update profile details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const p = await api.updateMyProfile(token, {
        bio: bioInput,
        githubUsername: githubInput,
        avatarUrl: avatarInput,
      });
      setProfile(p);
      setIsEditingProfile(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!teamNameInput.trim()) return;
    setTeamError(null);
    try {
      const res = await api.createTeam(token, teamNameInput.trim());
      setProfile(res.user);
      setTeamNameInput('');
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  // Join Team
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!inviteCodeInput.trim()) return;
    setTeamError(null);
    try {
      const res = await api.joinTeam(token, inviteCodeInput.trim());
      setProfile(res.user);
      setInviteCodeInput('');
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Failed to join team');
    }
  };

  // Leave Team
  const handleLeaveTeam = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to leave or disband this team?')) return;
    setTeamError(null);
    try {
      await api.leaveTeam(token);
      setTeamDetails(null);
      // Reload profile
      const p = await api.getMyProfile(token);
      setProfile(p);
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Failed to leave team');
    }
  };

  // --- RENDERING LANDING PAGE IF NOT SIGNED IN ---
  if (!token) {
    return (
      <div className="landing-page">
        <header className="navbar">
          <div className="navbar__brand">
            <span style={{ fontSize: '1.5rem' }}>🩺</span>
            <span>DevPulse SaaS</span>
          </div>
          <button
            className="btn theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <main className="landing-hero-section">
          <div className="hero-grid">
            <div className="hero-text-card">
              <span className="badge badge--primary">PRO RELEASE v1.5</span>
              <h1>Supercharge Developer Profiles & Skill Metrics</h1>
              <p>
                DevPulse is the premium SaaS platform tracking developer learning competency levels, aggregated github commit activity, and interactive team skill matrices. Built for modern developer organizations.
              </p>
              <div className="pricing-mini-grid">
                <div className="price-card">
                  <h4>Free Tier</h4>
                  <p className="price">$0</p>
                  <ul>
                    <li>✓ Track up to 10 Skills</li>
                    <li>✓ Latest 5 repos display</li>
                    <li>✓ standard UI dashboard</li>
                  </ul>
                </div>
                <div className="price-card price-card--featured">
                  <span className="price-tag">BEST VALUE</span>
                  <h4>Pro Plan</h4>
                  <p className="price">$9<span className="price-mo">/mo</span></p>
                  <ul>
                    <li>✓ Unlimited skills tracking</li>
                    <li>✓ Top 10 Repositories display</li>
                    <li>✓ SVG language distribution charts</li>
                    <li>✓ Interactive Skill Radar charts</li>
                    <li>✓ Multi-tenant Team Workspace</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="hero-auth-card">
              <AuthForm />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- RENDERING SIGNED-IN APP ---
  const isPro = profile?.subscriptionTier === 'pro';

  return (
    <div className="app-container">
      {/* SaaS Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span>🩺</span>
          <span>DevPulse Pro</span>
        </div>

        {profile && (
          <div className="sidebar__user-profile">
            <div className="user-avatar-initials">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" />
              ) : (
                profile.username.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{profile.username}</span>
              <span className={`subscription-badge subscription-badge--${profile.subscriptionTier}`}>
                {profile.subscriptionTier.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <nav className="sidebar__nav">
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'nav-link--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 My Dashboard
          </button>
          <button
            className={`nav-link ${activeTab === 'team' ? 'nav-link--active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team Workspace
          </button>
          <button
            className={`nav-link ${activeTab === 'billing' ? 'nav-link--active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            💳 Plan & Upgrades
          </button>
        </nav>

        <div className="sidebar__footer">
          <button
            className="btn btn--block theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button className="btn btn--danger btn--block" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      {/* Main SaaS Dashboard Container */}
      <main className="app-content">
        {loading && <div className="loader-overlay">Loading profile…</div>}

        {/* Tab 1: My Dashboard */}
        {activeTab === 'dashboard' && profile && (
          <div className="tab-view-container">
            <div className="dashboard-header-panel panel">
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <div className="form-group">
                    <label>Bio (Max 300 characters)</label>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={300}
                    />
                  </div>
                  <div className="form-group">
                    <label>Profile Image (Drag & Drop or Click)</label>
                    <div
                      className={`drag-drop-zone ${dragActive ? 'drag-drop-zone--active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('avatar-file-input')?.click()}
                    >
                      {avatarInput ? (
                        <div className="drag-drop-preview">
                          <img src={avatarInput} alt="Preview" />
                          <span>Click or drag new image to replace</span>
                        </div>
                      ) : (
                        <div className="drag-drop-placeholder">
                          <span>📷</span>
                          <p>Drag & drop an image here, or click to upload</p>
                          <span className="file-limit-note">Supports JPG, PNG, WEBP (Max 2MB)</span>
                        </div>
                      )}
                      <input
                        type="file"
                        id="avatar-file-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Profile Picture URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub Username</label>
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                    />
                  </div>
                  <div className="btn-group">
                    <button className="btn" type="submit">Save Changes</button>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <ProfileHeader profile={profile} />
                  <button className="btn btn--edit" onClick={() => setIsEditingProfile(true)}>
                    ✏️ Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Dashboard grid layout */}
            <div className="dashboard-sections-grid">
              {/* Skills section with list and SVG Radar graph */}
              <div className="panel skill-tracker-panel">
                <div className="panel-header-btn">
                  <h2>My Skill Competency</h2>
                  {!isPro && (
                    <span className="skills-limit-label">
                      {profile.skills.length} / 10 Skills (Free Limit)
                    </span>
                  )}
                </div>

                <div className="skills-grid-row">
                  {/* Skill Add Input Panel */}
                  <form className="add-skill-form" onSubmit={handleAddSkill}>
                    <h4>Add Competency Track</h4>
                    <div className="add-skill-inputs">
                      <input
                        type="text"
                        placeholder="Skill (e.g. React)"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        required
                      />
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <div className="progress-slider-group">
                        <label>Progress: {newSkillProgress}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={newSkillProgress}
                          onChange={(e) => setNewSkillProgress(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    {skillError && <p className="error-message">{skillError}</p>}
                    <button className="btn btn--secondary" type="submit">
                      ＋ Add Skill
                    </button>
                  </form>

                  {/* Skills List with delete button */}
                  <div className="interactive-skills-list">
                    {profile.skills.length === 0 ? (
                      <p className="skill-cards__empty">No skills tracked yet. Use the form to add skills.</p>
                    ) : (
                      profile.skills.map((skill) => (
                        <div className="interactive-skill-row" key={skill.name}>
                          <div className="skill-info">
                            <span className="name">{skill.name}</span>
                            <span className={`level badge badge--${skill.level.toLowerCase()}`}>
                              {skill.level}
                            </span>
                            <span className="progress-num">{skill.progress}%</span>
                          </div>
                          <div className="skill-row-bar">
                            <div className="fill" style={{ width: `${skill.progress}%` }} />
                          </div>
                          <button
                            className="btn-delete-skill"
                            onClick={() => handleRemoveSkill(skill.name)}
                            title="Remove Skill"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SVG Visual Skill Radar Chart */}
                <div className="skill-visualizations-row">
                  <SkillChart skills={profile.skills} />
                </div>
              </div>

              {/* GitHub integration section */}
              <div className="panel github-panel">
                <h2>GitHub Dashboard proxy</h2>
                <Suspense fallback={<p>Loading GitHub integration details…</p>}>
                  <GitHubFeed githubUsername={profile.githubUsername} />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Team Workspace */}
        {activeTab === 'team' && profile && (
          <div className="tab-view-container panel team-panel-main">
            <h2>👥 Team Workspace (Multi-Tenancy)</h2>

            {teamError && <p className="error-message">{teamError}</p>}

            {!profile.teamId ? (
              <div className="no-team-container">
                <p>
                  Collaborate with other developers! Create a shared workspace or enter an invitation join code.
                </p>
                <div className="team-forms-grid">
                  <form onSubmit={handleCreateTeam} className="team-setup-card card">
                    <h3>🚀 Spin Up a New Team</h3>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Team Name (e.g. Frontend Ninjas)"
                        value={teamNameInput}
                        onChange={(e) => setTeamNameInput(e.target.value)}
                        required
                      />
                    </div>
                    <button className="btn" type="submit">Create Team</button>
                  </form>

                  <form onSubmit={handleJoinTeam} className="team-setup-card card">
                    <h3>🔑 Join Existing Workspace</h3>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="8-Character Invite Code"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value)}
                        required
                      />
                    </div>
                    <button className="btn btn--secondary" type="submit">Join Team</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="active-team-container">
                {teamLoading ? (
                  <p>Fetching team sync state...</p>
                ) : (
                  teamDetails && (
                    <>
                      <div className="team-meta-header card">
                        <div className="team-info-left">
                          <h3>Workspace: {teamDetails.team.name}</h3>
                          <div className="invite-badge">
                            <span>INVITE CODE: </span>
                            <strong>{teamDetails.team.inviteCode}</strong>
                          </div>
                        </div>
                        <button className="btn btn--danger" onClick={handleLeaveTeam}>
                          {profile.role === 'owner' ? 'Disband Team' : 'Leave Team'}
                        </button>
                      </div>

                      {/* Team analytics grid */}
                      <div className="team-workspace-grid">
                        <div className="team-members-list-card card">
                          <h4>Team Members Competencies</h4>
                          <div className="team-members-rows">
                            {teamDetails.members.map((member) => (
                              <div className="team-member-row" key={member._id}>
                                <div className="member-meta">
                                  <strong>{member.username}</strong>
                                  <span className={`role-tag role-tag--${member.role}`}>
                                    {member.role.toUpperCase()}
                                  </span>
                                  {member.githubUsername && (
                                    <span className="github-tag">@{member.githubUsername}</span>
                                  )}
                                </div>
                                <div className="member-skills-badges">
                                  {member.skills.length === 0 ? (
                                    <span className="no-skills">No tracked skills</span>
                                  ) : (
                                    member.skills.map((sk) => (
                                      <span className="member-skill-bubble" key={sk.name}>
                                        {sk.name} ({sk.progress}%)
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team Leaderboard Comparison */}
                        <div className="team-leaderboard-card card">
                          <h4>Team Competency Radar Chart</h4>
                          {teamDetails.members.length > 0 ? (
                            <div className="leaderboard-rows">
                              <p className="dashboard-subtext">
                                Shared skills and top averages across workspace members.
                              </p>
                              {/* Calculate and draw average skill levels */}
                              {(() => {
                                const skillAverages: Record<string, { total: number; count: number }> = {};
                                teamDetails.members.forEach((m) => {
                                  m.skills.forEach((s) => {
                                    if (!skillAverages[s.name]) {
                                      skillAverages[s.name] = { total: 0, count: 0 };
                                    }
                                    skillAverages[s.name].total += s.progress;
                                    skillAverages[s.name].count += 1;
                                  });
                                });

                                const averagesList = Object.entries(skillAverages).map(
                                  ([name, data]) => ({
                                    name,
                                    average: Math.round(data.total / data.count),
                                    count: data.count,
                                  })
                                ).sort((a, b) => b.average - a.average);

                                if (averagesList.length === 0) {
                                  return <p className="no-skills">Add skills to member profiles to compile team radar metrics.</p>;
                                }

                                return (
                                  <div className="average-skills-chart">
                                    {averagesList.map((avg) => (
                                      <div className="avg-skill-row" key={avg.name}>
                                        <div className="avg-meta">
                                          <span>{avg.name}</span>
                                          <strong>{avg.average}% Avg ({avg.count} members)</strong>
                                        </div>
                                        <div className="avg-bar-track">
                                          <div className="fill" style={{ width: `${avg.average}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <p>Loading leaderboard...</p>
                          )}
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Billing & Upgrades */}
        {activeTab === 'billing' && profile && (
          <div className="tab-view-container panel billing-panel-main">
            <h2>💳 Plan & Billing Management</h2>
            <div className="billing-grid">
              <div className="billing-status-card card">
                <h3>Subscription Summary</h3>
                <div className="billing-status-info">
                  <div className="info-row">
                    <span>Account Tier</span>
                    <strong className={`status-text status-text--${profile.subscriptionTier}`}>
                      {profile.subscriptionTier.toUpperCase()} PLAN
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>Subscription Status</span>
                    <strong className="status-text status-text--active">
                      {profile.subscriptionStatus.toUpperCase()}
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>Skills Tracked</span>
                    <strong>{profile.skills.length} / {isPro ? 'Unlimited' : '10 limit'}</strong>
                  </div>
                  <div className="info-row">
                    <span>GitHub Display Limit</span>
                    <strong>{isPro ? '10 repos (Pro metadata unlocked)' : '5 repos'}</strong>
                  </div>
                </div>
              </div>

              {!isPro ? (
                <div className="upgrade-cta-card card">
                  <span className="badge badge--primary">RECOMMENDED</span>
                  <h3>Upgrade to DevPulse Pro</h3>
                  <p className="upgrade-price">$9<span className="mo">/month</span></p>
                  <p className="upgrade-desc">
                    Unlock detailed SVG radar chart graphs, multi-tenant developer teams, detailed language breakdown analytics, and unlimited skill additions.
                  </p>
                  <button className="btn btn--block btn--featured" onClick={() => setShowCheckout(true)}>
                    ⭐ Upgrade Account Now
                  </button>
                </div>
              ) : (
                <div className="pro-active-card card">
                  <h3>⭐ Pro Plan Fully Unlocked</h3>
                  <p className="pro-desc">
                    You have active access to all SaaS features. Multi-tenancy, custom radars, and extended GitHub endpoints are active on your profile.
                  </p>
                  <div className="pro-active-check">✓ Unlimited Skills (Active)</div>
                  <div className="pro-active-check">✓ 10 Repo feed + SVG Donut language chart (Active)</div>
                  <div className="pro-active-check">✓ Team workspace sharing (Active)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* simulated stripe payment checkout modal */}
      {showCheckout && (
        <div className="modal-backdrop">
          <div className="modal-content panel checkout-modal">
            <button className="modal-close" onClick={() => setShowCheckout(false)}>×</button>

            {checkoutSuccess ? (
              <div className="checkout-success-view">
                <span className="success-icon">🎉</span>
                <h3>Payment Approved!</h3>
                <p>Welcome to DevPulse Pro. Upgrading subscription tier details...</p>
              </div>
            ) : (
              <>
                <h3>🔒 Secure checkout (Stripe Simulation)</h3>
                <p className="checkout-subtext">Upgrading account profile to Pro for $9.00/month.</p>
                <form onSubmit={handleCheckoutSubmit}>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-grid-row">
                    <div className="form-group">
                      <label>Expiration Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVC / CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button className="btn btn--block btn--featured" type="submit" disabled={checkoutLoading}>
                    {checkoutLoading ? 'Processing Secure payment...' : 'Pay $9.00 & Upgrade'}
                  </button>
                  <p className="secured-by">🔒 Simulated 256-bit SSL transaction</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
