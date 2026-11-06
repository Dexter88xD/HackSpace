import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { User } from '../../database/entities/user.entity';
import { RoleName } from '../../database/entities/user-role.entity';
import applicationDataSource from '../../database/data-source';

const makeSkill = (id = 1, name = 'TypeScript'): Skill =>
  ({ id, name, normalizedName: name.toLowerCase() }) as Skill;

describe('SkillsService', () => {
  let service: SkillsService;
  const skills = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const profiles = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
  };
  const users = { findOne: jest.fn() };
  const builder = {
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    execute: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(builder).forEach((mock) => mock.mockReturnValue(builder));
    builder.execute.mockResolvedValue({});
    skills.createQueryBuilder.mockReturnValue(builder);
    profiles.findOne.mockResolvedValue({ id: 10 });
    profiles.findOneBy.mockResolvedValue({ id: 10 });
    profiles.existsBy.mockResolvedValue(true);
    users.findOne.mockResolvedValue({
      role: { role_name: RoleName.ROLE_ADMIN },
    });
    skills.findOneBy.mockResolvedValue(makeSkill());
    skills.findBy.mockResolvedValue([makeSkill()]);
    skills.update.mockResolvedValue({ affected: 1 });
    service = new SkillsService(
      skills as unknown as Repository<Skill>,
      profiles as unknown as Repository<UserProfile>,
      users as unknown as Repository<User>,
    );
  });

  it('lists catalog skills in a stable order', async () => {
    skills.find.mockResolvedValue([makeSkill()]);
    await expect(service.findAll()).resolves.toEqual([makeSkill()]);
    expect(skills.find).toHaveBeenCalledWith({
      order: { name: 'ASC', id: 'ASC' },
    });
  });

  it('finds by ID without loading profile relations', async () => {
    await expect(service.findOne(1)).resolves.toEqual(makeSkill());
    expect(skills.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('finds by normalized exact name', async () => {
    await expect(service.findByName('  TYPEscript \n')).resolves.toEqual(
      makeSkill(),
    );
    expect(skills.findOneBy).toHaveBeenCalledWith({
      normalizedName: 'typescript',
    });
  });

  it.each(['id', 'name'])('rejects a missing skill by %s', async (kind) => {
    skills.findOneBy.mockResolvedValue(null);
    await expect(
      kind === 'id' ? service.findOne(9) : service.findByName('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty list for an existing profile without skills', async () => {
    skills.find.mockResolvedValue([]);
    await expect(service.findByProfile(10)).resolves.toEqual([]);
    expect(skills.find).toHaveBeenCalledWith({
      where: { profiles: { id: 10 } },
      order: { name: 'ASC', id: 'ASC' },
    });
  });

  it('rejects a missing profile during reads', async () => {
    profiles.findOneBy.mockResolvedValue(null);
    await expect(service.findByProfile(10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('attaches a skill by ID for its profile owner', async () => {
    await expect(service.add({ profileId: 10, id: 1 }, 7)).resolves.toEqual(
      makeSkill(),
    );
    expect(profiles.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(profiles.existsBy).toHaveBeenCalledWith({ id: 10, user: { id: 7 } });
    expect(users.findOne).not.toHaveBeenCalled();
    expect(builder.values).toHaveBeenCalledWith({
      profile_id: 10,
      skill_id: 1,
    });
    expect(builder.orIgnore).toHaveBeenCalled();
  });

  it.each([undefined, null])(
    'reuses a matching name when id is %p without a catalog insert',
    async (id) => {
      await expect(
        service.add({ profileId: 10, id, name: ' TypeScript ' }, 7),
      ).resolves.toEqual(makeSkill());
      expect(skills.findOneBy).toHaveBeenCalledWith({
        normalizedName: 'typescript',
      });
      expect(builder.into).not.toHaveBeenCalledWith(Skill);
    },
  );

  it('creates a missing name and tolerates concurrent creation', async () => {
    skills.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeSkill(2, 'Machine Learning'));
    await expect(
      service.add({ profileId: 10, name: ' Machine \n Learning ' }, 7),
    ).resolves.toEqual(makeSkill(2, 'Machine Learning'));
    expect(builder.values).toHaveBeenCalledWith({
      name: 'Machine Learning',
      normalizedName: 'machine learning',
    });
    expect(builder.orIgnore).toHaveBeenCalledTimes(2);
    expect(builder.values).toHaveBeenLastCalledWith({
      profile_id: 10,
      skill_id: 2,
    });
  });

  it('uses the ID even when a different name is supplied', async () => {
    await expect(
      service.add({ profileId: 10, id: 1, name: 'JavaScript' }, 7),
    ).resolves.toEqual(makeSkill());
    expect(skills.findOneBy).toHaveBeenCalledTimes(1);
    expect(skills.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(builder.into).not.toHaveBeenCalledWith(Skill);
  });

  it('creates a catalog skill without a profile and skips profile checks and assignment', async () => {
    skills.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeSkill());
    await expect(service.add({ name: 'TypeScript' }, 7)).resolves.toEqual(
      makeSkill(),
    );
    expect(profiles.findOne).not.toHaveBeenCalled();
    expect(profiles.existsBy).not.toHaveBeenCalled();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(builder.into).toHaveBeenCalledWith(Skill);
    expect(builder.into).not.toHaveBeenCalledWith('user_profile_skills');
    expect(builder.execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    { id: 1 },
    { name: 'TypeScript' },
    { id: null, name: 'TypeScript' },
  ])('reuses a catalog skill without a profile: %p', async (dto) => {
    await expect(service.add(dto, 7)).resolves.toEqual(makeSkill());
    expect(profiles.findOne).not.toHaveBeenCalled();
    expect(profiles.existsBy).not.toHaveBeenCalled();
    expect(users.findOne).not.toHaveBeenCalled();
    expect(skills.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects a missing catalog-only skill ID without creating it from the supplied name', async () => {
    skills.findOneBy.mockResolvedValue(null);
    await expect(
      service.add({ id: 999, name: 'Fallback' }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(profiles.findOne).not.toHaveBeenCalled();
    expect(skills.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('supports batches mixing catalog-only and profile additions', async () => {
    skills.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeSkill())
      .mockResolvedValueOnce(makeSkill());
    await expect(
      service.addBatch([{ name: 'TypeScript' }, { profileId: 10, id: 1 }], 7),
    ).resolves.toEqual([makeSkill(), makeSkill()]);
    expect(profiles.findOne).toHaveBeenCalledTimes(1);
    expect(builder.into).toHaveBeenCalledTimes(2);
    expect(builder.into).toHaveBeenCalledWith(Skill);
    expect(builder.into).toHaveBeenCalledWith('user_profile_skills');
  });

  it('calls add once per DTO in input order and preserves duplicate results', async () => {
    const add = jest
      .spyOn(service, 'add')
      .mockImplementation((dto) =>
        Promise.resolve(makeSkill(dto.id ?? undefined, dto.name)),
      );
    const dtos = [
      { profileId: 20, id: 2, name: 'Second' },
      { profileId: 10, id: 1, name: 'First' },
      { profileId: 10, id: 1, name: 'First' },
    ];
    await expect(service.addBatch(dtos, 7)).resolves.toEqual([
      makeSkill(2, 'Second'),
      makeSkill(1, 'First'),
      makeSkill(1, 'First'),
    ]);
    expect(add).toHaveBeenCalledTimes(3);
    expect(add).toHaveBeenNthCalledWith(1, dtos[0], 7);
    expect(add).toHaveBeenNthCalledWith(2, dtos[1], 7);
    expect(add).toHaveBeenNthCalledWith(3, dtos[2], 7);
    add.mockRestore();
  });

  it('waits for each addition before starting the next', async () => {
    let finishFirst!: (skill: Skill) => void;
    const first = new Promise<Skill>((resolve) => {
      finishFirst = resolve;
    });
    const add = jest
      .spyOn(service, 'add')
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(makeSkill(2));
    const pending = service.addBatch(
      [
        { profileId: 10, id: 1 },
        { profileId: 10, id: 2 },
      ],
      7,
    );
    expect(add).toHaveBeenCalledTimes(1);
    finishFirst(makeSkill());
    await expect(pending).resolves.toEqual([makeSkill(), makeSkill(2)]);
    expect(add).toHaveBeenCalledTimes(2);
    add.mockRestore();
  });

  it('stops at the first failure and skips later DTOs', async () => {
    const error = new NotFoundException('Skill not found');
    const add = jest
      .spyOn(service, 'add')
      .mockResolvedValueOnce(makeSkill())
      .mockRejectedValueOnce(error);
    const dtos = [
      { profileId: 10, id: 1 },
      { profileId: 10, id: 2 },
      { profileId: 10, id: 3 },
    ];
    await expect(service.addBatch(dtos, 7)).rejects.toBe(error);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenNthCalledWith(1, dtos[0], 7);
    expect(add).toHaveBeenNthCalledWith(2, dtos[1], 7);
    add.mockRestore();
  });

  it('rejects a missing skill without inserting assignments', async () => {
    skills.findOneBy.mockResolvedValue(null);
    await expect(
      service.add({ profileId: 10, id: 99, name: 'Fallback' }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(skills.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects a missing profile during mutation', async () => {
    profiles.findOne.mockResolvedValue(null);
    await expect(
      service.add({ profileId: 10, id: 1 }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(skills.findOneBy).not.toHaveBeenCalled();
  });

  it('allows admins to manage another profile', async () => {
    profiles.existsBy.mockResolvedValue(false);
    await expect(service.add({ profileId: 10, id: 1 }, 7)).resolves.toEqual(
      makeSkill(),
    );
    expect(users.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      relations: { role: true },
    });
  });

  it.each([null, { role: { role_name: RoleName.ROLE_USER } }])(
    'rejects nonowners without admin status: %p',
    async (user) => {
      profiles.existsBy.mockResolvedValue(false);
      users.findOne.mockResolvedValue(user);
      await expect(
        service.add({ profileId: 10, id: 1 }, 7),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(builder.execute).not.toHaveBeenCalled();
    },
  );

  it('detaches a deduplicated batch without deleting catalog skills', async () => {
    await expect(
      service.removeFromProfile(10, [1, 1], 7),
    ).resolves.toBeUndefined();
    expect(builder.andWhere).toHaveBeenCalledWith('skill_id IN (:...ids)', {
      ids: [1],
    });
    expect(skills.delete).not.toHaveBeenCalled();
  });

  it('allows removing an existing skill that is already detached', async () => {
    builder.execute.mockResolvedValue({ affected: 0 });
    await expect(
      service.removeFromProfile(10, [1], 7),
    ).resolves.toBeUndefined();
  });

  it('rejects removal of missing catalog skills', async () => {
    skills.findBy.mockResolvedValue([]);
    await expect(service.removeFromProfile(10, [1], 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(builder.execute).not.toHaveBeenCalled();
  });

  it('rejects unauthorized removal', async () => {
    profiles.existsBy.mockResolvedValue(false);
    users.findOne.mockResolvedValue(null);
    await expect(service.removeFromProfile(10, [1], 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('renames both name fields for admins', async () => {
    await expect(
      service.update(1, { name: '  New \n Name ' }, 7),
    ).resolves.toEqual({
      id: 1,
      name: 'New Name',
      normalizedName: 'new name',
    });
    expect(skills.update).toHaveBeenCalledWith(1, {
      name: 'New Name',
      normalizedName: 'new name',
    });
  });

  it('returns 404 if the skill disappears before its update', async () => {
    skills.update.mockResolvedValue({ affected: 0 });
    await expect(
      service.update(1, { name: 'New Name' }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns conflict for duplicate normalized names', async () => {
    skills.update.mockRejectedValue(
      new QueryFailedError('update', [], { code: '23505' } as never),
    );
    await expect(
      service.update(1, { name: 'JavaScript' }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates unrelated database failures', async () => {
    const error = new Error('Database unavailable');
    skills.update.mockRejectedValue(error);
    await expect(service.update(1, { name: 'JavaScript' }, 7)).rejects.toBe(
      error,
    );
    builder.execute.mockRejectedValue(error);
    await expect(service.add({ profileId: 10, id: 1 }, 7)).rejects.toBe(error);
  });

  it('rejects a rename of a missing skill', async () => {
    skills.findOneBy.mockResolvedValue(null);
    await expect(service.update(1, { name: 'TS' }, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an existing catalog skill', async () => {
    skills.delete.mockResolvedValue({ affected: 1 });
    await expect(service.remove(1, 7)).resolves.toBeUndefined();
    expect(skills.delete).toHaveBeenCalledWith(1);
  });

  it('rejects deletion of a missing catalog skill', async () => {
    skills.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('prevents nonadmins from renaming or deleting shared skills', async () => {
    users.findOne.mockResolvedValue({
      role: { role_name: RoleName.ROLE_USER },
    });
    await expect(service.update(1, { name: 'TS' }, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(skills.update).not.toHaveBeenCalled();
    expect(skills.delete).not.toHaveBeenCalled();
  });
});

// Opt in only against a disposable PostgreSQL database; never use application credentials.
const postgres = process.env.SKILLS_TEST_DB_PORT ? describe : describe.skip;
postgres('SkillsService PostgreSQL integration', () => {
  let db: DataSource;
  let service: SkillsService;
  let profileId: number;
  let otherProfileId: number;
  let ownerId: number;
  let adminId: number;

  beforeAll(async () => {
    db = new DataSource({
      type: 'postgres',
      entities: applicationDataSource.options.entities,
      migrations: applicationDataSource.options.migrations,
      host: '127.0.0.1',
      port: Number(process.env.SKILLS_TEST_DB_PORT),
      username: 'skillstest',
      password: 'skillstest',
      database: 'skillstest',
      synchronize: false,
    });
    await db.initialize();
    await db.runMigrations();
    service = new SkillsService(
      db.getRepository(Skill),
      db.getRepository(UserProfile),
      db.getRepository(User),
    );
    const [owner] = await db.query<Array<{ id: number }>>(`INSERT INTO users
      (username, full_name, email, password_hash) VALUES ('owner', 'Owner', 'owner@test', 'hash') RETURNING id`);
    const [admin] = await db.query<Array<{ id: number }>>(`INSERT INTO users
      (username, full_name, email, password_hash, "roleId")
      SELECT 'admin', 'Admin', 'admin@test', 'hash', id FROM user_roles
      WHERE role_name = 'ROLE_ADMIN' RETURNING id`);
    ownerId = owner.id;
    adminId = admin.id;
    const [profile] = await db.query<Array<{ id: number }>>(
      `INSERT INTO user_profiles ("userId") VALUES ($1) RETURNING id`,
      [ownerId],
    );
    const [other] = await db.query<Array<{ id: number }>>(
      `INSERT INTO user_profiles ("userId") VALUES ($1) RETURNING id`,
      [adminId],
    );
    profileId = profile.id;
    otherProfileId = other.id;
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it.each(['missing skill', 'missing profile', 'forbidden profile'])(
    'keeps earlier additions committed after a later %s failure and skips remaining entries',
    async (failure) => {
      const name = `Committed before ${failure}`;
      const failed =
        failure === 'missing skill'
          ? { profileId, id: 999999 }
          : {
              profileId:
                failure === 'missing profile' ? 999999 : otherProfileId,
              name: 'Rejected',
            };
      await expect(
        service.addBatch(
          [{ profileId, name }, failed, { profileId, name: 'Never Reached' }],
          failure === 'forbidden profile' ? ownerId : adminId,
        ),
      ).rejects.toBeInstanceOf(
        failure === 'forbidden profile'
          ? ForbiddenException
          : NotFoundException,
      );
      const committed = await service.findByName(name);
      expect(await service.findByProfile(profileId)).toEqual([committed]);
      expect(
        await db
          .getRepository(Skill)
          .findOneBy({ normalizedName: 'never reached' }),
      ).toBeNull();
      expect(
        await db.getRepository(Skill).findOneBy({ normalizedName: 'rejected' }),
      ).toBeNull();
      await service.remove(committed.id, adminId);
    },
  );

  it('keeps a newly created catalog skill if its profile disappears before assignment', async () => {
    const [profile] = await db.query<Array<{ id: number }>>(
      `INSERT INTO user_profiles (bio) VALUES (NULL) RETURNING id`,
    );
    const repository = db.getRepository(UserProfile);
    const exists = jest
      .spyOn(repository, 'existsBy')
      .mockImplementationOnce(async () => {
        await repository.delete(profile.id);
        return false;
      });
    try {
      await expect(
        service.add({ profileId: profile.id, name: 'Unassigned' }, adminId),
      ).rejects.toBeInstanceOf(QueryFailedError);
      const skill = await service.findByName('Unassigned');
      const assignments = await db.query<Array<{ skill_id: number }>>(
        'SELECT skill_id FROM user_profile_skills WHERE skill_id = $1',
        [skill.id],
      );
      expect(assignments).toEqual([]);
      await service.remove(skill.id, adminId);
    } finally {
      exists.mockRestore();
    }
  });

  it('seeds unassigned catalog skills and can attach them to a profile later', async () => {
    const seeded = await service.addBatch(
      [
        { name: 'Seed Skill' },
        { name: 'Other Seed Skill' },
        { name: ' SEED SKILL ' },
      ],
      adminId,
    );
    expect(seeded[0].id).toBe(seeded[2].id);
    expect(await db.getRepository(Skill).count()).toBe(2);
    expect(await db.query('SELECT * FROM user_profile_skills')).toEqual([]);
    await service.add({ profileId, id: seeded[0].id }, ownerId);
    expect(await service.findByProfile(profileId)).toEqual([seeded[0]]);
    for (const id of new Set(seeded.map((skill) => skill.id)))
      await service.remove(id, adminId);
  });

  it('handles concurrent matching names and duplicate assignments across profiles', async () => {
    const results = await Promise.all([
      service.add({ profileId, name: 'TypeScript' }, ownerId),
      service.add(
        { profileId: otherProfileId, id: null, name: ' TYPESCRIPT ' },
        adminId,
      ),
      service.addBatch(
        [
          { profileId, name: 'typescript' },
          { profileId, name: 'TypeScript' },
        ],
        ownerId,
      ),
    ]);
    expect(new Set(results.flat().map((skill) => skill.id)).size).toBe(1);
    expect(await db.getRepository(Skill).count()).toBe(1);
    expect(await service.findByProfile(profileId)).toHaveLength(1);
    expect(await service.findByProfile(otherProfileId)).toHaveLength(1);
  });

  it('handles concurrent cross-profile batches while preserving input order', async () => {
    const profiles = await db.query<Array<{ id: number }>>(
      `INSERT INTO user_profiles (bio) SELECT NULL FROM generate_series(1, 4) RETURNING id`,
    );
    const [a, b, c, d] = profiles.map((profile) => profile.id);
    const batches = [
      [
        { profileId: a, name: 'Batch B' },
        { profileId: b, name: 'Batch A' },
      ],
      [
        { profileId: c, name: 'Batch A' },
        { profileId: d, name: 'Batch B' },
      ],
      [
        { profileId: b, name: 'Batch B' },
        { profileId: a, name: 'Batch A' },
      ],
    ];
    const results = await Promise.all(
      batches.map((dtos) => service.addBatch(dtos, adminId)),
    );
    results.forEach((skills, index) => {
      expect(skills.map((skill) => skill.name)).toEqual(
        batches[index].map((dto) => dto.name),
      );
    });
    expect(await service.findByProfile(a)).toHaveLength(2);
    expect(await service.findByProfile(b)).toHaveLength(2);
    const batchSkills = [...new Set(results.flat().map((skill) => skill.id))];
    expect(batchSkills).toHaveLength(2);
    for (const id of batchSkills) await service.remove(id, adminId);
    await db
      .getRepository(UserProfile)
      .delete(profiles.map((profile) => profile.id));
  });

  it('enforces permissions and preserves assignments during renames and name conflicts', async () => {
    const skill = await service.findByName('typescript');
    await expect(
      service.add({ profileId: otherProfileId, id: skill.id }, ownerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update(skill.id, { name: 'Renamed' }, ownerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove(skill.id, ownerId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await service.update(skill.id, { name: 'Typed Script' }, adminId);
    expect(await service.findByProfile(otherProfileId)).toEqual([
      expect.objectContaining({
        id: skill.id,
        name: 'Typed Script',
        normalizedName: 'typed script',
      }),
    ]);
    const other = await service.add({ profileId, name: 'JavaScript' }, ownerId);
    await expect(
      service.update(skill.id, { name: 'JAVASCRIPT' }, adminId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await service.findOne(skill.id)).name).toBe('Typed Script');
    await service.remove(other.id, adminId);
    await service.update(skill.id, { name: 'TypeScript' }, adminId);
  });

  it('keeps catalog entries during repeated detachment, and cascades catalog deletion', async () => {
    const skill = await service.findByName('typescript');
    await service.removeFromProfile(profileId, [skill.id], ownerId);
    await service.removeFromProfile(profileId, [skill.id], ownerId);
    expect(await service.findByProfile(profileId)).toEqual([]);
    expect(await service.findOne(skill.id)).toBeDefined();
    await service.remove(skill.id, adminId);
    expect(await service.findByProfile(otherProfileId)).toEqual([]);
    expect(await db.getRepository(Skill).count()).toBe(0);
  });

  it('reverts and reapplies the new migration without touching legacy skill data', async () => {
    await db.query(`INSERT INTO user_skills (name) VALUES ('Legacy')`);
    await db.undoLastMigration();
    expect(await db.query(`SELECT to_regclass('skill') AS table_name`)).toEqual(
      [{ table_name: null }],
    );
    expect(await db.query(`SELECT name FROM user_skills`)).toEqual([
      { name: 'Legacy' },
    ]);
    await db.runMigrations();
    expect(await db.getRepository(Skill).count()).toBe(0);
  });
});
