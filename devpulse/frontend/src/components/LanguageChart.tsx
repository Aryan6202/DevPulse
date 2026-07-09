interface LanguageChartProps {
  stats: Record<string, number> | null;
}

export default function LanguageChart({ stats }: LanguageChartProps) {
  if (!stats || Object.keys(stats).length === 0) {
    return <p className="github-feed__status">No language statistics available.</p>;
  }

  // Predefined colors for common languages
  const languageColors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    Java: '#b07219',
    CPlusPlus: '#f34b7d',
    'C++': '#f34b7d',
    C: '#555555',
    Go: '#00ADD8',
    Rust: '#dea584',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Shell: '#89e051',
  };

  const getRandomColor = (lang: string) => {
    if (languageColors[lang]) return languageColors[lang];
    // Hash function to generate a stable color based on string
    let hash = 0;
    for (let i = 0; i < lang.length; i++) {
      hash = lang.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const total = Object.values(stats).reduce((sum, val) => sum + val, 0);

  const sortedLanguages = Object.entries(stats)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: getRandomColor(name),
    }))
    .sort((a, b) => b.count - a.count);

  // Donut chart calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327
  let accumulatedPercent = 0;

  return (
    <div className="language-chart-container">
      <h3>Code Language Distribution</h3>
      <div className="language-chart-layout">
        {/* SVG Donut Chart */}
        <div className="donut-chart">
          <svg viewBox="0 0 100 100" width="160" height="160">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--bg-panel-border, #e5e7eb)"
              strokeWidth="10"
            />
            {sortedLanguages.map((lang) => {
              if (lang.percentage === 0) return null;
              const strokeDasharray = `${(lang.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += lang.percentage;

              return (
                <circle
                  key={lang.name}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={lang.color}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: 'stroke-dashoffset 0.8s ease, stroke-dasharray 0.8s ease',
                    cursor: 'pointer',
                  }}
                >
                  <title>{`${lang.name}: ${lang.percentage}%`}</title>
                </circle>
              );
            })}
            <g className="donut-center-text">
              <text x="50%" y="47%" textAnchor="middle" dy="0.1em" className="donut-text-number">
                {total}
              </text>
              <text x="50%" y="62%" textAnchor="middle" className="donut-text-label">
                Repos
              </text>
            </g>
          </svg>
        </div>

        {/* Breakdown bar & legends */}
        <div className="language-legends">
          {/* Horizontal multi-color bar */}
          <div className="language-bar">
            {sortedLanguages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                  height: '100%',
                }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>

          {/* Detailed legends list */}
          <div className="legends-grid">
            {sortedLanguages.map((lang) => (
              <div className="legend-item" key={lang.name}>
                <span className="legend-bullet" style={{ backgroundColor: lang.color }} />
                <span className="legend-name">{lang.name}</span>
                <span className="legend-percent">{lang.percentage}%</span>
                <span className="legend-count">({lang.count} {lang.count === 1 ? 'repo' : 'repos'})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
