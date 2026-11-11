import { BadRequestException } from '@nestjs/common';
import type { HackathonPhaseDto } from '../dto/hackathon-phase.dto';
import { HackathonPhaseName } from '../entities/hackathon-phase.entity';

export function validatePhaseSchedule(
  phases: HackathonPhaseDto[],
  hackathonStartAt: Date,
  hackathonEndAt: Date,
): void {
  const hackathonStart = hackathonStartAt.getTime();
  const hackathonEnd = hackathonEndAt.getTime();

  if (!Number.isFinite(hackathonStart) || !Number.isFinite(hackathonEnd)) {
    throw new BadRequestException('Invalid hackathon start or end date');
  }

  if (hackathonStart >= hackathonEnd) {
    throw new BadRequestException(
      'Hackathon start date must be before its end date',
    );
  }

  const validPhaseOrder = [
    HackathonPhaseName.LAUNCH,
    HackathonPhaseName.REGISTRATION,
    HackathonPhaseName.IN_PROGRESS,
    HackathonPhaseName.EVALUATION,
    HackathonPhaseName.FINISHED,
  ];

  if (phases.length !== validPhaseOrder.length) {
    throw new BadRequestException(
      `A hackathon schedule must contain exactly ${validPhaseOrder.length} phases`,
    );
  }

  let previousEnd: number | null = null;

  for (const [i, phase] of phases.entries()) {
    const start = new Date(phase.startAt).getTime();
    const end = new Date(phase.endAt).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new BadRequestException(
        `Phase ${phase.phaseName} has an invalid start or end date`,
      );
    }

    if (start >= end) {
      throw new BadRequestException(
        `Phase ${phase.phaseName} must start before it ends`,
      );
    }

    if (start < hackathonStart) {
      throw new BadRequestException(
        `Phase ${phase.phaseName} cannot start before the hackathon`,
      );
    }

    if (end > hackathonEnd) {
      throw new BadRequestException(
        `Phase ${phase.phaseName} cannot end after the hackathon`,
      );
    }

    if (phase.phaseName !== validPhaseOrder[i]) {
      throw new BadRequestException(
        `Invalid phase order: expected ${validPhaseOrder[i]}, received ${phase.phaseName}`,
      );
    }

    if (previousEnd !== null && start < previousEnd) {
      throw new BadRequestException(
        `Phase ${phase.phaseName} overlaps with the previous phase`,
      );
    }

    previousEnd = end;
  }
}
