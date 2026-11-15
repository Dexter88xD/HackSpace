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
    throw new BadRequestException(
      'Hackathon start and end dates must be valid dates.',
    );
  }

  if (hackathonStart >= hackathonEnd) {
    throw new BadRequestException(
      'Hackathon start date must be earlier than its end date.',
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
    throw new BadRequestException('A hackathon must have exactly 5 phases.');
  }

  let previousEnd: number | null = null;

  for (const [i, phase] of phases.entries()) {
    const start = new Date(phase.startAt).getTime();
    const end = new Date(phase.endAt).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new BadRequestException(
        `${phase.phaseName}: Start and end dates must be valid.`,
      );
    }

    if (start >= end) {
      throw new BadRequestException(
        `${phase.phaseName}: Start date must be earlier than end date.`,
      );
    }

    if (phase.phaseName !== validPhaseOrder[i]) {
      throw new BadRequestException(
        `Invalid phase order: expected ${validPhaseOrder[i]}, but received ${phase.phaseName}.`,
      );
    }

    if (i === 0 && start !== hackathonStart) {
      throw new BadRequestException(
        `Launch phase must start when the hackathon begins.`,
      );
    }

    if (i === validPhaseOrder.length - 1 && end !== hackathonEnd) {
      throw new BadRequestException(
        `Finished phase must end when the hackathon ends.`,
      );
    }

    if (previousEnd !== null && start !== previousEnd) {
      throw new BadRequestException(
        `${phase.phaseName}: Start date must match the previous phase's end date.`,
      );
    }

    previousEnd = end;
  }
}
