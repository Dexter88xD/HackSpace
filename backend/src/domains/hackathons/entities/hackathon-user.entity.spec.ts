import { HackathonUser, HackRoleName } from './hackathon-user.entity';

describe('HackathonUser defaults', () => {
  it('starts as a participant but can be assigned another role', () => {
    const membership = new HackathonUser();
    expect(membership.hackRoleName).toBe(HackRoleName.PARTICIPANT);

    membership.hackRoleName = HackRoleName.ORGANIZER;
    expect(membership.hackRoleName).toBe(HackRoleName.ORGANIZER);
  });
});
