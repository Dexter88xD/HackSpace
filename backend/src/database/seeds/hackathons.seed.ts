import { EntityManager } from 'typeorm';
import { User } from '../entities/user.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { HackathonSettings } from '../entities/hackathon-settings.entity';
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../entities/hackathon-phase.entity';
import { HackathonUser, HackRoleName } from '../entities/hackathon-user.entity';

const DAY = 24 * 60 * 60 * 1000;
const HACKATHON_COUNT = 200;
const SEED_PREFIX = '[DEV]';

const themes = [
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

const formats = [
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

const organizations = [
  'HackSpace',
  'Morocco Tech Community',
  'Atlas Innovation',
  'Digital Future Lab',
  'Open Source Collective',
  'Campus Innovation Network',
  'Green Technology Alliance',
  'Data Builders Community',
];

const phases = [
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

  const now = Date.now();
  let created = 0;
  let settingsCreated = 0;
  let phasesCreated = 0;
  let membershipsCreated = 0;

  for (let index = 0; index < HACKATHON_COUNT; index++) {
    const theme = themes[index % themes.length];
    const format = formats[Math.floor(index / themes.length)];
    const title = `${SEED_PREFIX} ${theme} ${format}`;

    const activePhaseIndex = index % phases.length;
    const scheduleStart = now - (activePhaseIndex * 4 + 1) * DAY;

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
          organizationName: organizations[index % organizations.length],
          startAt: new Date(scheduleStart),
          endAt: new Date(scheduleStart + phases.length * 4 * DAY),
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
          minTeamMembers: 1,
          maxTeamMembers: 5,
          filesLimit: 3,
          fileMaxSize: 10 * 1024 * 1024,
          hackathon,
        }),
      );
    }

    const existingPhaseNames = new Set(
      (hackathon.phases ?? []).map((phase) => phase.phaseName),
    );

    const missingPhases = phases.flatMap((phaseName, phaseIndex) => {
      if (existingPhaseNames.has(phaseName)) {
        return [];
      }

      const phaseStart = hackathon.startAt.getTime() + phaseIndex * 4 * DAY;

      return [
        phaseRepository.create({
          phaseName: phaseName,
          description: `${phaseName.replace(/_/g, ' ')} phase`,
          startAt: new Date(phaseStart),
          endAt: new Date(phaseStart + 4 * DAY),
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
    `Phases: ${phasesCreated} created, ${HACKATHON_COUNT * phases.length - phasesCreated} skipped`,
  );
  console.log(
    `Organizers: ${membershipsCreated} created, ${HACKATHON_COUNT - membershipsCreated} skipped`,
  );
  return created;
}
