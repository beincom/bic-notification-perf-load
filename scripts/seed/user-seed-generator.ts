import { CONFIGS } from '../../config';
import { generateRandomString } from '../../src/utils/utils';

export type SeedUser = {
  username: string;
  fullname: string;
  email: string;
  password: string;
};

export function generateUserNameSeed(userNumber: number): string {
  return `${CONFIGS.USERNAME_PREFIX}${userNumber}`;
}

export function generateUserSeedFromUserNumber(userNumber: number): SeedUser {
  const username = generateUserNameSeed(userNumber);

  return generateUserSeedFromUsername(username);
}

export function generateUserSeedFromUsername(username: string): SeedUser {
  const name = generateRandomString(9).replace(/\b[a-z]/, (letter) => letter.toUpperCase());
  const fullname = `${CONFIGS.FULL_NAME_PREFIX} ${name}`;
  const email = `${username}@${CONFIGS.EMAIL_DOMAIN}`;

  return {
    username,
    fullname,
    email,
    password: CONFIGS.DEFAULT_PASSWORD,
  };
}
