import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, QueryFailedError, Repository } from 'typeorm';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { User } from '../../database/entities/user.entity';
import { RoleName } from '../../database/entities/user-role.entity';
import { AddSkillDto, AddSkillsDto } from './dto/add-skill.dto';
import { cleanSkillName, SkillNameQueryDto } from './dto/skill-validation.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(query?: SkillNameQueryDto): Promise<Skill[]> {
    if (query == undefined || query.name == undefined) {
      return this.skillRepository.find({ order: { name: 'ASC', id: 'ASC' } });
    }
    return this.skillRepository.find({
      where: { normalizedName: ILike(`%${query.name}%`) },
      order: { name: 'ASC', id: 'ASC' },
      take: 20,
    });
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOneBy({ id });
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  async findByName(name: string): Promise<Skill> {
    const { normalizedName } = this.names(name);
    const skill = await this.skillRepository.findOneBy({ normalizedName });
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  async findByProfile(profileId: number): Promise<Skill[]> {
    const profile = await this.profileRepository.findOneBy({
      id: profileId,
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.skillRepository.find({
      where: { profiles: { id: profileId } },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async add(dto: AddSkillDto, userId: number): Promise<Skill> {
    if (dto.profileId !== undefined) {
      await this.writableProfile(dto.profileId, userId);
    }
    let skill: Skill | null;
    if (dto.id != null) {
      skill = await this.skillRepository.findOneBy({ id: dto.id });
    } else {
      const names = this.names(dto.name!);
      skill = await this.skillRepository.findOneBy({
        normalizedName: names.normalizedName,
      });
      if (!skill) {
        // Another request may create the same name between the lookup and insert.
        await this.skillRepository
          .createQueryBuilder()
          .insert()
          .into(Skill)
          .values(names)
          .orIgnore()
          .execute();
        skill = await this.skillRepository.findOneBy({
          normalizedName: names.normalizedName,
        });
      }
    }
    if (!skill) throw new NotFoundException('Skill not found');
    if (dto.profileId !== undefined) {
      await this.skillRepository
        .createQueryBuilder()
        .insert()
        .into('user_profile_skills')
        .values({ profile_id: dto.profileId, skill_id: skill.id })
        .orIgnore()
        .execute();
    }
    return skill;
  }

  async addBatch(dtos: AddSkillsDto, userId: number): Promise<Skill[]> {
    const skills: Skill[] = [];
    for (const dto of dtos) {
      skills.push(await this.add(dto, userId));
    }
    return skills;
  }

  async removeFromProfile(
    profileId: number,
    skillIds: number[],
    userId: number,
  ): Promise<void> {
    const ids = [...new Set(skillIds)];
    await this.writableProfile(profileId, userId);
    const skills = await this.skillRepository.findBy({ id: In(ids) });
    if (skills.length !== ids.length)
      throw new NotFoundException('Skill not found');
    await this.skillRepository
      .createQueryBuilder()
      .delete()
      .from('user_profile_skills')
      .where('profile_id = :profileId', { profileId })
      .andWhere('skill_id IN (:...ids)', { ids })
      .execute();
  }

  async update(
    id: number,
    dto: UpdateSkillDto,
    userId: number,
  ): Promise<Skill> {
    const names = this.names(dto.name);
    await this.requireAdmin(userId);
    const skill = await this.findOne(id);
    try {
      const result = await this.skillRepository.update(id, names);
      if (!result.affected) throw new NotFoundException('Skill not found');
      return Object.assign(skill, names);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Skill name already exists');
      }
      throw error;
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.requireAdmin(userId);
    const result = await this.skillRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Skill not found');
  }

  private names(value: string): { name: string; normalizedName: string } {
    const name = cleanSkillName(value);
    return { name, normalizedName: name.toLowerCase() };
  }

  private async requireAdmin(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (user?.role?.roleName !== RoleName.ROLE_ADMIN)
      throw new ForbiddenException('Forbidden');
  }

  private async writableProfile(
    profileId: number,
    userId: number,
  ): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const owned = await this.profileRepository.existsBy({
      id: profileId,
      user: { id: userId },
    });
    if (!owned) await this.requireAdmin(userId);
  }
}
