import { CONFIGS } from '../../config';
import { makeArrayFromRange } from '../../src/utils/utils';
import { Community, SysAdmin, User, randomSleep } from '../http/http-service';
import { generatePostSeed } from '../seed/content-seed-generator';
import { generateCommunityName } from '../seed/group-seed-generator';
import { generateUserNameSeed } from '../seed/user-seed-generator';

export interface ISeedDataFrom {
  communityIndex: number;
}

export async function createData(from: ISeedDataFrom): Promise<void> {
  console.log({ step: 'START' });

  const { communityIndex: fromCommunityIndex } = from;

  const sysAdmin = await SysAdmin.init();

  for (
    let communityIndex = fromCommunityIndex;
    communityIndex < fromCommunityIndex + CONFIGS.NUMBER_OF_COMMUNITIES;
    communityIndex++
  ) {
    const communityName = generateCommunityName(communityIndex);
    const community = await sysAdmin.findCommunityByName(communityName);
    if (!community) {
      return console.log({ step: 'FINISHED Cannot find the community' });
    }

    // await setupCommunityMembers(community, sysAdmin);
    await createContents(community, sysAdmin);
  }

  sysAdmin.cleanUp();

  return console.log({ step: 'FINISHED' });
}

async function setupCommunityMembers(community: Community, sysAdmin: SysAdmin): Promise<void> {
  const communityOwner = await sysAdmin.findUserById(community.owner_id);
  const communityMembers = await sysAdmin.getCommunityMembers(community.id, 200);
  console.log({
    step: 'setupCommunityMembers',
    subStep: 'getCommunityMembers',
    community: community.name,
    memberCount: communityMembers?.length,
  });

  const expectedMemberUsernames = makeArrayFromRange(1, CONFIGS.NUMBER_OF_USERS).map(
    generateUserNameSeed
  );
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
    const owner = await User.init({ username: communityOwner.username });

    await owner.declineAllJoinRequests(community.group_id);
    console.log({
      step: 'setupCommunityMembers',
      subStep: 'declineAllJoinRequests',
      community: community.name,
    });

    await Promise.all(
      missingMemberUsernames.map(async (username) => {
        const sleep = await randomSleep();
        const user = await User.init({ username });
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

async function createContents(community: Community, sysAdmin: SysAdmin): Promise<void> {
  const seedContents = Array.from({ length: CONFIGS.NUMBER_OF_CONTENTS_IN_COMMUNITY }, (_, i) =>
    generatePostSeed(i + 1)
  );

  const communityMembers = await sysAdmin.getCommunityMembers(community.id, 10);
  console.log({
    step: 'createContents',
    subStep: 'getCommunityMembers',
    community: community.name,
    memberCount: communityMembers?.length,
  });

  for (const communityMemberIndex of Object.keys(communityMembers)) {
    await randomSleep();

    const communityMember = communityMembers[communityMemberIndex];
    const member = await User.init({ username: communityMember.username });

    // each member pick 10 contents to publish until all contents are published
    const contentsToPublish = seedContents.slice(
      +communityMemberIndex * 10,
      (+communityMemberIndex + 1) * 10
    );

    await Promise.all(
      contentsToPublish.map(async (content) => {
        const sleep = await randomSleep();

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
