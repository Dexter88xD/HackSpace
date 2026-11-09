import { User } from './user.entity';

describe('User defaults', () => {
  it('starts unverified unless explicitly verified', () => {
    const user = new User();
    expect(user.emailVerified).toBe(false);

    user.emailVerified = true;
    expect(user.emailVerified).toBe(true);
  });
});
