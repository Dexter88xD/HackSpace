import { EntityManager } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Skill } from '../../domains/skills/entities/skill.entity';
import { cleanSkillName } from '../../domains/skills/dto/skill-validation.dto';

export const SKILL_NAMES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Dart',
  'HTML',
  'CSS',
  'Sass',
  'React',
  'Vue.js',
  'Angular',
  'Svelte',
  'Next.js',
  'Nuxt',
  'Node.js',
  'NestJS',
  'Express',
  'Django',
  'Flask',
  'FastAPI',
  'Spring Boot',
  'Laravel',
  'Ruby on Rails',
  'ASP.NET Core',
  'GraphQL',
  'REST API Design',
  'WebSockets',
  'PostgreSQL',
  'MySQL',
  'SQLite',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'SQL',
  'Database Design',
  'Data Modeling',
  'Docker',
  'Kubernetes',
  'Linux',
  'Bash',
  'Git',
  'GitHub Actions',
  'GitLab CI',
  'Jenkins',
  'Terraform',
  'Ansible',
  'AWS',
  'Azure',
  'Google Cloud',
  'Nginx',
  'Apache Kafka',
  'RabbitMQ',
  'Prometheus',
  'Grafana',
  'OpenTelemetry',
  'CI/CD',
  'Unit Testing',
  'Integration Testing',
  'Jest',
  'Cypress',
  'Playwright',
  'Test Driven Development',
  'Cybersecurity',
  'OAuth 2.0',
  'Network Security',
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Pandas',
  'NumPy',
  'TensorFlow',
  'PyTorch',
  'Scikit-learn',
  'Data Visualization',
  'Data Engineering',
  'Apache Spark',
  'Statistics',
  'Figma',
  'UI Design',
  'UX Research',
  'Prototyping',
  'Wireframing',
  'Accessibility',
  'Design Systems',
  'Agile',
  'Scrum',
  'Project Management',
  'Technical Writing',
  'Communication',
  'Teamwork',
] as const;

const assignments: Record<string, readonly string[]> = {
  dev_user_1: ['TypeScript', 'React', 'HTML', 'CSS', 'Accessibility'],
  dev_user_2: ['TypeScript', 'NestJS', 'PostgreSQL', 'REST API Design', 'Git'],
  dev_user_3: [
    'Python',
    'Pandas',
    'Machine Learning',
    'Statistics',
    'PostgreSQL',
  ],
  dev_user_4: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'Git'],
  dev_user_5: [
    'Figma',
    'UI Design',
    'UX Research',
    'Prototyping',
    'Accessibility',
  ],
};

export async function seedSkills(
  manager: EntityManager,
  users: Map<string, User>,
): Promise<void> {
  const repository = manager.getRepository(Skill);
  const skills = new Map<string, Skill>();
  let created = 0;
  let assignmentsCreated = 0;
  for (const value of SKILL_NAMES) {
    const name = cleanSkillName(value);
    const normalizedName = name.toLowerCase();
    let skill = await repository.findOneBy({ normalizedName });
    if (!skill) {
      skill = await repository.save(
        repository.create({ name, normalizedName }),
      );
      created++;
    }
    skills.set(value, skill);
  }
  for (const [username, names] of Object.entries(assignments)) {
    const user = users.get(username);
    if (!user) throw new Error(`Missing seeded user: ${username}`);
    const profile = await manager.getRepository(UserProfile).findOne({
      where: { user: { id: user.id } },
      relations: { skills: true },
    });
    if (!profile) throw new Error(`Missing seeded profile: ${username}`);
    const existingIds = new Set(profile.skills.map((skill) => skill.id));
    for (const name of names) {
      const skill = skills.get(name);
      if (!skill) throw new Error(`Missing catalog skill: ${name}`);
      if (existingIds.has(skill.id)) continue;
      await manager
        .createQueryBuilder()
        .insert()
        .into('user_profile_skills')
        .values({ profile_id: profile.id, skill_id: skill.id })
        .orIgnore()
        .execute();
      assignmentsCreated++;
    }
  }
  console.log(
    `Skills: ${created} created, ${SKILL_NAMES.length - created} skipped`,
  );
  console.log(
    `Profile skills: ${assignmentsCreated} created, ${25 - assignmentsCreated} skipped`,
  );
}
