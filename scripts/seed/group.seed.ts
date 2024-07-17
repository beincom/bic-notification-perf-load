import { StringHelper } from '@shared/helpers';

import { UserMock, UserSeeding } from './user.seed';

import { CONFIGS } from '@config';

export type CommunityMock = {
  name: string;
  owner: UserMock;
  admins: UserMock[];
  members: UserMock[];
};

export type GroupMock = {
  name: string;
  admins: UserMock[];
  members: UserMock[];
};

export class GroupSeeding {
  public static seedCommunity(communityNumber: number): CommunityMock {
    const firstUserIndex = (communityNumber - 1) * CONFIGS.NUMBER_OF_COMMUNITIES + 1;
    const lastUserIndex = firstUserIndex + CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY - 1;

    const memberRange =
      lastUserIndex <= CONFIGS.NUMBER_OF_USERS
        ? [firstUserIndex, lastUserIndex]
        : [
            CONFIGS.NUMBER_OF_USERS - CONFIGS.NUMBER_OF_COMMUNITY_MEMBERS_IN_COMMUNITY + 1,
            CONFIGS.NUMBER_OF_USERS,
          ];

    const members = StringHelper.generateArrayFromNumberRange(memberRange[0], memberRange[1]).map(
      (num) => UserSeeding.seedUserFromNumber(num)
    );

    const admins = members.slice(0, CONFIGS.NUMBER_OF_COMMUNITY_ADMINS_IN_COMMUNITY);

    return {
      name: GroupSeeding.seedCommunityName(communityNumber),
      owner: UserSeeding.seedUserFromNumber(communityNumber),
      members,
      admins,
    };
  }

  public static seedCommunityName(index: number): string {
    return `${CONFIGS.COMMUNITY_NAME_PREFIX} ${index}`;
  }

  public static seedGroup(communityNumber: number, groupNumber: number): GroupMock {
    const { members: communityMembers } = GroupSeeding.seedCommunity(communityNumber);
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
      name: GroupSeeding.seedGroupName(groupNumber),
      members,
      admins,
    };
  }

  public static seedGroupName(groupIndex: number): string {
    return `${CONFIGS.GROUP_NAME_PREFIX} ${groupIndex}`;
  }
}
