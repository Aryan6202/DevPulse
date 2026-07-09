import type { Skill } from '../types';
import '../styles/SkillCards.css';

interface SkillCardsProps {
  skills: Skill[];
}

export default function SkillCards({ skills }: SkillCardsProps) {
  if (skills.length === 0) {
    return <p className="skill-cards__empty">No skills tracked yet. Add one to get started.</p>;
  }

  return (
    <section className="skill-cards" aria-label="Skills">
      {skills.map((skill) => (
        <article className="skill-card" key={skill.name}>
          <div className="skill-card__top">
            <h3>{skill.name}</h3>
            <span className={`skill-card__level skill-card__level--${skill.level.toLowerCase()}`}>
              {skill.level}
            </span>
          </div>
          <div className="skill-card__bar" role="progressbar" aria-valuenow={skill.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="skill-card__bar-fill" style={{ width: `${skill.progress}%` }} />
          </div>
          <span className="skill-card__percent">{skill.progress}%</span>
        </article>
      ))}
    </section>
  );
}
