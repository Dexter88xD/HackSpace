import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { Brackets, Repository } from 'typeorm';
import { HackathonFiltersDto } from './dto/hackathon-filters.dto';

// This service handles fetching hackathons from the database.
// It supports searching, filtering by dates and currently active phase,
// and pagination to return results in manageable pages.
@Injectable()
export class HackathonService {
  constructor(
    @InjectRepository(Hackathon)
    private readonly hackthonRepository: Repository<Hackathon>,
  ) {}

  async findAll(filterQuery: HackathonFiltersDto) {
    if (
      filterQuery.startDate &&
      filterQuery.endDate &&
      filterQuery.startDate > filterQuery.endDate
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }
    const query = this.hackthonRepository.createQueryBuilder('hackathon');
    const pageNumber = filterQuery.page ?? 1;
    const pageLimit = filterQuery.limit ?? 12;

    if (filterQuery.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('hackathon.title ILIKE :search')
            .orWhere('hackathon.description ILIKE :search')
            .orWhere('hackathon.organization_name ILIKE :search');
        }),
        { search: `%${filterQuery.search}%` },
      );
    }

    if (filterQuery.startDate) {
      query.andWhere('hackathon.end_at >= :startDate', {
        startDate: filterQuery.startDate,
      });
    }

    if (filterQuery.endDate) {
      const nextDay = new Date(`${filterQuery.endDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.andWhere('hackathon.start_at < :nextDay', {
        nextDay,
      });
    }

    if (filterQuery.phase) {
      const now = new Date();
      query
        .innerJoin('hackathon.phases', 'phase')
        .andWhere('phase.phase_name = :phase', { phase: filterQuery.phase })
        .andWhere('phase.start_at <= :now', { now })
        .andWhere('phase.end_at > :now', { now });
    }

    query
      .orderBy('hackathon.start_at', 'ASC')
      .addOrderBy('hackathon.id', 'ASC')
      .skip((pageNumber - 1) * pageLimit)
      .take(pageLimit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page: pageNumber,
      limit: pageLimit,
    };
  }
}
