import type { Skill } from '../types';

interface SkillChartProps {
  skills: Skill[];
}

export default function SkillChart({ skills }: SkillChartProps) {
  if (skills.length === 0) {
    return <p className="skill-cards__empty">No skills available to build chart analytics.</p>;
  }

  // Fallback to vertical columns/bars if we have less than 3 skills (cannot draw a radar polygon)
  const isRadarPossible = skills.length >= 3;

  if (!isRadarPossible) {
    return (
      <div className="skill-bar-chart-container">
        <h3>Skill Competency Benchmarks</h3>
        <div className="vertical-bar-chart">
          {skills.map((skill) => (
            <div key={skill.name} className="v-bar-group">
              <div className="v-bar-label">
                <span className="v-bar-name">{skill.name}</span>
                <span className="v-bar-val">{skill.progress}% ({skill.level})</span>
              </div>
              <div className="v-bar-track">
                <div
                  className="v-bar-fill"
                  style={{
                    width: `${skill.progress}%`,
                    background: 'linear-gradient(90deg, var(--color-primary-light, #818cf8), var(--color-primary, #6366f1))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Radar chart implementation
  const numPoints = skills.length;
  const center = 50;
  const maxRadius = 38;

  // Compute angles for each skill point
  const getCoordinates = (index: number, progress: number) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const currentRadius = (progress / 100) * maxRadius;
    const x = center + currentRadius * Math.cos(angle);
    const y = center + currentRadius * Math.sin(angle);
    return { x, y, angle };
  };

  // Concentric rings lines (25%, 50%, 75%, 100%)
  const rings = [25, 50, 75, 100];
  const ringPolygons = rings.map((ringPercent) => {
    return Array.from({ length: numPoints }, (_, i) => {
      const { x, y } = getCoordinates(i, ringPercent);
      return `${x},${y}`;
    }).join(' ');
  });

  // User skill shape coordinates
  const skillPoints = skills.map((skill, i) => {
    const { x, y } = getCoordinates(i, skill.progress);
    return `${x},${y}`;
  }).join(' ');

  // Axis lines from center to outer bounds
  const axisLines = Array.from({ length: numPoints }, (_, i) => {
    const start = { x: center, y: center };
    const end = getCoordinates(i, 100);
    return { start, end };
  });

  // Labels coordinates
  const labelDistance = 45; // slightly beyond outer ring
  const labelPositions = skills.map((skill, i) => {
    const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
    const x = center + labelDistance * Math.cos(angle);
    const y = center + labelDistance * Math.sin(angle);
    
    // Determine text alignment based on position
    let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    if (Math.cos(angle) < -0.1) textAnchor = 'end';
    
    let dy = '0.35em';
    if (Math.sin(angle) > 0.8) dy = '0.8em';
    if (Math.sin(angle) < -0.8) dy = '-0.2em';

    return { name: skill.name, x, y, textAnchor, dy };
  });

  return (
    <div className="skill-chart-container">
      <h3>Skill Competency Radar</h3>
      <div className="radar-layout">
        <svg viewBox="0 0 100 100" width="100%" height="240px" className="radar-svg">
          {/* Concentric grid rings */}
          {ringPolygons.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="var(--bg-panel-border, #e5e7eb)"
              strokeWidth="0.5"
              strokeDasharray={idx < 3 ? '1 1' : 'none'}
            />
          ))}

          {/* Core axis lines */}
          {axisLines.map((line, idx) => (
            <line
              key={idx}
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              stroke="var(--bg-panel-border, #e5e7eb)"
              strokeWidth="0.5"
            />
          ))}

          {/* Shaded filled skill shape */}
          <polygon
            points={skillPoints}
            fill="var(--color-radar-fill, rgba(99, 102, 241, 0.25))"
            stroke="var(--color-primary, #6366f1)"
            strokeWidth="1.5"
            className="radar-poly"
          />

          {/* Dots on corners */}
          {skills.map((skill, i) => {
            const { x, y } = getCoordinates(i, skill.progress);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="1.5"
                fill="var(--color-primary, #6366f1)"
                stroke="var(--bg-panel, #ffffff)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Skill Labels */}
          {labelPositions.map((label, idx) => (
            <text
              key={idx}
              x={label.x}
              y={label.y}
              textAnchor={label.textAnchor}
              dy={label.dy}
              className="radar-label"
            >
              {label.name}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
