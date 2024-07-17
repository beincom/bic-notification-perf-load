import { Community } from '@http/types';
import { HttpHelper } from '@http/http.helper';

import { StringHelper } from '@shared/helpers';

import { ContentSeeding } from '@seed/content.seed';
import { GroupSeeding } from '@seed/group.seed';
import { UserSeeding } from '@seed/user.seed';

import { CONFIGS } from '@config';

import { SysAdminService, UserService } from '../user';

export class ContentService {
  public static async createData(from: number): Promise<void> {
    console.log({ step: '[createData]:: Start to create data.' });
    const sysAdmin = await SysAdminService.init();

    for (
      let communityIndex = from;
      communityIndex < from + CONFIGS.NUMBER_OF_COMMUNITIES;
      communityIndex++
    ) {
      const communityName = GroupSeeding.seedCommunityName(communityIndex);
      const community = await sysAdmin.getCommunityByName(communityName);
      if (!community) {
        return console.log({ step: '[createData]:: Finished - Cannot find the community.' });
      }

      // await ContentService.setupCommunityMembers(community, sysAdmin);
      await ContentService.createContents(community, sysAdmin);
    }

    sysAdmin.cleanUp();
    return console.log({ step: '[createData]:: Finished' });
  }

  public static async setupCommunityMembers(
    community: Community,
    sysAdmin: SysAdminService
  ): Promise<void> {
    const communityOwner = await sysAdmin.getUserById(community.owner_id);
    const communityMembers = await sysAdmin.getCommunityMembers(community.id, 200);
    console.log({
      step: 'setupCommunityMembers',
      subStep: 'getCommunityMembers',
      community: community.name,
      memberCount: communityMembers?.length,
    });

    const expectedMemberUsernames = StringHelper.generateArrayFromNumberRange(
      1,
      CONFIGS.NUMBER_OF_USERS
    ).map((num) => UserSeeding.seedUsername(num));

    const missingMemberUsernames = expectedMemberUsernames.filter(
      (username) => !communityMembers.some((member) => member.username === username)
    );

    console.log({
      step: 'setupCommunityMembers',
      subStep: 'getMissingExpectedMembers',
      community: community.name,
      missingMemberCount: missingMemberUsernames.length,
    });

    if (missingMemberUsernames.length) {
      const owner = await UserService.init({ username: communityOwner.username });

      await owner.declineAllJoinRequests(community.group_id);
      console.log({
        step: 'setupCommunityMembers',
        subStep: 'declineAllJoinRequests',
        community: community.name,
      });

      await Promise.all(
        missingMemberUsernames.map(async (username) => {
          const sleep = await HttpHelper.sleep();
          const user = await UserService.init({ username });
          await user.joinGroup(community.group_id);
          user.cleanUp();
          console.log({
            step: 'setupCommunityMembers',
            subStep: 'joinCommunity',
            community: community.name,
            user: username,
            sleep,
          });
        })
      );

      await owner.approveAllJoinRequests(community.group_id);
      console.log({
        step: 'setupCommunityMembers',
        subStep: 'approveAllJoinRequests',
        community: community.name,
      });

      owner.cleanUp();
    }
  }

  public static async createContents(
    community: Community,
    sysAdmin: SysAdminService
  ): Promise<void> {
    const seedContents = Array.from({ length: CONFIGS.NUMBER_OF_CONTENTS_IN_COMMUNITY }, (_, i) =>
      ContentSeeding.seedPost(i + 1)
    );

    const communityMembers = await sysAdmin.getCommunityMembers(community.id, 10);
    console.log({
      step: 'createContents',
      subStep: 'getCommunityMembers',
      community: community.name,
      memberCount: communityMembers?.length,
    });

    for (const communityMemberIndex of Object.keys(communityMembers)) {
      await HttpHelper.sleep();

      const communityMember = communityMembers[communityMemberIndex];
      const member = await UserService.init({ username: communityMember.username });

      // each member pick 10 contents to publish until all contents are published
      const contentsToPublish = seedContents.slice(
        +communityMemberIndex * 10,
        (+communityMemberIndex + 1) * 10
      );

      await Promise.all(
        contentsToPublish.map(async (content) => {
          const sleep = await HttpHelper.sleep();

          const { id } = await member.createDraftPost([community.group_id]);
          console.log(
            JSON.stringify({
              step: 'createContents',
              subStep: 'createDraftPost',
              community: community.name,
              member: member.username,
              memberIndex: communityMemberIndex,
              postId: id,
              sleep,
            })
          );

          await member.publishPost(id, content);
          console.log(
            JSON.stringify({
              step: 'createContents',
              subStep: 'publishPost',
              community: community.name,
              member: member.username,
              memberIndex: communityMemberIndex,
              postId: id,
              sleep,
            })
          );
        })
      );

      console.log({
        step: 'FINISHED publishing contents per member',
        community: community.name,
        member: member.username,
        memberIndex: communityMemberIndex,
      });

      member.cleanUp();
    }
  }
}
