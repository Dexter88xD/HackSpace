import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { Repository } from 'typeorm';
import { HackathonPhaseName } from '../../database/entities/hackathon-phase.entity';

// This service handles fetching hackathons from the database.
// It supports searching, filtering by dates and currently active phase,
// and pagination to return results in manageable pages.
@Injectable()
export class HackathonService {
  constructor(
    @InjectRepository(Hackathon)
    private readonly hackthonRepository: Repository<Hackathon>,
  ) {}

  async findAll(
    search?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number,
    phase?: HackathonPhaseName,
  ) {
    const query = this.hackthonRepository.createQueryBuilder('hackathon');
    const pageNumber = page ?? 1;
    const pageLimit = limit ?? 12;

    if (search) {
      query.andWhere(
        'hackathon.title ILIKE :search OR hackathon.description ILIKE :search OR hackathon.organization_name ILIKE :search',
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      query.andWhere('DATE(hackathon.start_at) >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('DATE(hackathon.start_at) <= :endDate', { endDate });
    }

    if (phase) {
      console.log('Current server time:', new Date());
      query
        .innerJoin('hackathon.phases', 'phase')
        .andWhere('phase.phase_name = :phase', { phase })
        .andWhere('phase.start_at <= :now', { now: new Date() })
        .andWhere('phase.end_at > :now', { now: new Date() });
    }
    query.skip((pageNumber - 1) * pageLimit).take(pageLimit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
    };
  }
}
