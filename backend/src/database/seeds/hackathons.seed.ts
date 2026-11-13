import { EntityManager } from 'typeorm';
import { User } from '../../domains/users/entities/user.entity';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { HackathonSettings } from '../../domains/hackathons/entities/hackathon-settings.entity';
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../../domains/hackathons/entities/hackathon-phase.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../../domains/hackathons/entities/hackathon-user.entity';

const DAY = 24 * 60 * 60 * 1000;
const PHASE_DURATION = 4 * DAY;
const HACKATHON_COUNT = 200;
const SEED_PREFIX = '[DEV]';

const THEMES = [
  'Artificial Intelligence',
  'Smart Agriculture',
  'Renewable Energy',
  'Cybersecurity',
  'Digital Healthcare',
  'Financial Inclusion',
  'Open Data',
  'Climate Technology',
  'Education Technology',
  'Ocean Protection',
  'Robotics',
  'Smart Cities',
  'Cloud Computing',
  'Data Engineering',
  'Accessibility',
  'Water Conservation',
  'Sustainable Transport',
  'Space Technology',
  'Language Learning',
  'Cultural Heritage',
];

const FORMATS = [
  'Challenge',
  'Hackathon',
  'Innovation Cup',
  'Buildathon',
  'Sprint',
  'Hackfest',
  'Open',
  'Weekend',
  'Lab',
  'Quest',
];

const ORGANIZATIONS = [
  'HackSpace',
  'Morocco Tech Community',
  'Atlas Innovation',
  'Digital Future Lab',
  'Open Source Collective',
  'Campus Innovation Network',
  'Green Technology Alliance',
  'Data Builders Community',
];

const PHASE_NAMES = [
  HackathonPhaseName.LAUNCH,
  HackathonPhaseName.REGISTRATION,
  HackathonPhaseName.IN_PROGRESS,
  HackathonPhaseName.EVALUATION,
  HackathonPhaseName.FINISHED,
];

export async function seedHackathons(
  manager: EntityManager,
  devUser: User,
  devAdmin: User,
): Promise<number> {
  const hackathonRepository = manager.getRepository(Hackathon);
  const settingsRepository = manager.getRepository(HackathonSettings);
  const phaseRepository = manager.getRepository(HackathonPhase);
  const membershipRepository = manager.getRepository(HackathonUser);

  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);
  const referenceTime = now.getTime();
  let created = 0;
  let settingsCreated = 0;
  let phasesCreated = 0;
  let membershipsCreated = 0;

  for (let index = 0; index < HACKATHON_COUNT; index++) {
    const theme = THEMES[index % THEMES.length];
    const format = FORMATS[Math.floor(index / THEMES.length)];
    const title = `${SEED_PREFIX} ${theme} ${format}`;

    const activePhaseIndex = index % PHASE_NAMES.length;
    const scheduleStart =
      referenceTime - (activePhaseIndex * PHASE_DURATION + DAY);

    let hackathon = await hackathonRepository.findOne({
      where: { title },
      relations: {
        settings: true,
        phases: true,
      },
    });

    if (!hackathon) {
      hackathon = await hackathonRepository.save(
        hackathonRepository.create({
          title,
          description:
            `${format} focused on ${theme.toLowerCase()}, ` +
            'collaboration, practical innovation and problem-solving.',
          organizationName: ORGANIZATIONS[index % ORGANIZATIONS.length],
          startAt: new Date(scheduleStart),
          endAt: new Date(scheduleStart + PHASE_NAMES.length * PHASE_DURATION),
        }),
      );

      created++;
    }

    const organizer = index % 2 === 0 ? devUser : devAdmin;

    const existingMembership = await membershipRepository.findOne({
      where: {
        user: { id: organizer.id },
        hackathon: { id: hackathon.id },
      },
    });

    if (!existingMembership) {
      membershipsCreated++;
      await membershipRepository.save(
        membershipRepository.create({
          user: organizer,
          hackathon,
          hackRoleName: HackRoleName.ORGANIZER,
        }),
      );
    }

    if (!hackathon.settings) {
      settingsCreated++;
      await settingsRepository.save(
        settingsRepository.create({
          filesLimit: 3,
          fileMaxSize: 10 * 1024 * 1024,
          hackathon,
        }),
      );
    }

    const existingPhaseNames = new Set(
      (hackathon.phases ?? []).map((phase) => phase.phaseName),
    );

    const missingPhases = PHASE_NAMES.flatMap((phaseName, phaseIndex) => {
      if (existingPhaseNames.has(phaseName)) {
        return [];
      }

      const phaseStart =
        hackathon.startAt.getTime() + phaseIndex * PHASE_DURATION;

      return [
        phaseRepository.create({
          phaseName: phaseName,
          description: `${phaseName.replace(/_/g, ' ')} phase`,
          startAt: new Date(phaseStart),
          endAt: new Date(phaseStart + PHASE_DURATION),
          hackathon,
        }),
      ];
    });

    if (missingPhases.length > 0) {
      await phaseRepository.save(missingPhases);
      phasesCreated += missingPhases.length;
    }
  }

  console.log(
    `Hackathons: ${created} created, ${HACKATHON_COUNT - created} skipped`,
  );
  console.log(
    `Settings: ${settingsCreated} created, ${HACKATHON_COUNT - settingsCreated} skipped`,
  );
  console.log(
    `Phases: ${phasesCreated} created, ${HACKATHON_COUNT * PHASE_NAMES.length - phasesCreated} skipped`,
  );
  console.log(
    `Organizers: ${membershipsCreated} created, ${HACKATHON_COUNT - membershipsCreated} skipped`,
  );
  return created;
}
