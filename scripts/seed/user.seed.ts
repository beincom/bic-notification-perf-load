import { CONFIGS } from '@config';
import { StringHelper } from '@shared/helpers';

export type UserMock = {
  username: string;
  fullname: string;
  email: string;
  password: string;
};

export class UserSeeding {
  public static seedUsername(userNumber: number): string {
    return `${CONFIGS.USERNAME_PREFIX}${userNumber}`;
  }

  public static seedUserFromNumber(userNumber: number): UserMock {
    const username = UserSeeding.seedUsername(userNumber);
    return UserSeeding.seedUserFromUsername(username);
  }

  public static seedUserFromUsername(username: string): UserMock {
    const name = StringHelper.generateRandomString(9).replace(/\b[a-z]/, (letter) =>
      letter.toUpperCase()
    );

    const fullname = `${CONFIGS.FULL_NAME_PREFIX} ${name}`;
    const email = `${username}@${CONFIGS.EMAIL_DOMAIN}`;

    return {
      username,
      fullname,
      email,
      password: CONFIGS.DEFAULT_PASSWORD,
    };
  }
}
