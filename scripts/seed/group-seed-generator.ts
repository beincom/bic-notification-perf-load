import { CONFIGS } from '../../config';
import { makeArrayFromRange } from '../../src/utils/utils';

import { SeedUser, generateUserSeedFromUserNumber } from './user-seed-generator';

export type SeedCommunity = {
  name: string;
  owner: SeedUser;
  admins: SeedUser[];
  members: SeedUser[];
};

export type SeedGroup = {
  name: string;
  admins: SeedUser[];
  members: SeedUser[];
};

export function generateCommunitySeed(communityNumber: number): SeedCommunity {
  const firstUserIndex = (communityNumber - 1) * CONFIGS.NUMBER_OF_COMMUNITIES + 1;
  const lastUserIndex = firstUserIndex + CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY - 1;

  const memberRange =
    lastUserIndex <= CONFIGS.NUMBER_OF_USERS
      ? [firstUserIndex, lastUserIndex]
      : [
          CONFIGS.NUMBER_OF_USERS - CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY + 1,
          CONFIGS.NUMBER_OF_USERS,
        ];

  const members = makeArrayFromRange(memberRange[0], memberRange[1]).map(
    generateUserSeedFromUserNumber
  );
  const admins = members.slice(0, CONFIGS.NUMBER_OF_COMMUNITY_ADMINS_IN_COMMUNITY);

  return {
    name: generateCommunityName(communityNumber),
    owner: generateUserSeedFromUserNumber(communityNumber),
    members,
    admins,
  };
}

export function generateCommunityName(index: number): string {
  return `${CONFIGS.COMMUNITY_NAME_PREFIX} ${index}`;
}

export function generateGroupSeed(communityNumber: number, groupNumber: number): SeedGroup {
  const { members: communityMembers } = generateCommunitySeed(communityNumber);
  const firstMemberNumber = (groupNumber - 1) * CONFIGS.NUMBER_OF_GROUP_MEMBERS_IN_GROUP + 1;
  const lastMemberNumber = firstMemberNumber + CONFIGS.NUMBER_OF_GROUP_MEMBERS_IN_GROUP - 1;

  const memberIndexRange =
    lastMemberNumber <= CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY
      ? [firstMemberNumber - 1, lastMemberNumber - 1]
      : [
          CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY -
            CONFIGS.NUMBER_OF_GROUP_MEMBERS_IN_GROUP,
          CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY - 1,
        ];

  const members = communityMembers.slice(memberIndexRange[0], memberIndexRange[1] + 1);
  const admins = members.slice(0, CONFIGS.NUMBER_OF_GROUP_ADMINS_IN_GROUP);

  return {
    name: generateGroupName(groupNumber),
    members,
    admins,
  };
}

export function generateGroupName(groupIndex: number): string {
  return `${CONFIGS.GROUP_NAME_PREFIX} ${groupIndex}`;
}
