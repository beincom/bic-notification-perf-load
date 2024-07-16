/* eslint-disable @typescript-eslint/ban-ts-comment */
import { check, group } from 'k6'; // @ts-ignore
import httpagg from 'k6/x/httpagg';

import { Actor } from '../entities/actor';
import { generateRandomNumber } from '../utils/utils';

export async function timelineScenario(): Promise<void> {
  await group('TimelineSession', async () => {
    const actor = Actor.init();

    const testCommunities = [
      {
        id: '0fc426c6-02ad-46ba-a397-b16c6d9d6ab9',
        group_id: '567fc4ae-3b53-42f0-865e-96cee8c1462b',
        name: 'BE Test Community 100',
      },
      {
        id: '36e9e1ac-de8c-482f-bb34-28a6c2d45ff1',
        group_id: '59083482-25db-4e58-9948-08c54a01c704',
        name: 'BE Test Community 101',
      },
      {
        id: '84e0147f-78c3-4f8a-9d82-2e5da3e75b17',
        group_id: 'a5af6318-7105-43fb-bf9d-cc3fb1185641',
        name: 'BE Test Community 102',
      },
      {
        id: 'c5cf9f76-766d-4e95-bf6e-50b092b86a32',
        group_id: '45195673-7037-48b4-a59c-0fbdc8bd87ed',
        name: 'BE Test Community 103',
      },
      {
        id: 'dfcdba26-1f18-42d2-a982-905839664ab6',
        group_id: 'f5adb934-4eab-4c31-8072-2f0683e0f736',
        name: 'BE Test Community 104',
      },
      {
        id: 'a989dc5e-3ffd-42af-8d6b-030b91d41e89',
        group_id: 'b8ea5c56-1430-4177-8179-4ac0b1895eb5',
        name: 'BE Test Community 105',
      },
      {
        id: '46f888bf-5545-468a-95af-d0bd5c3dae51',
        group_id: '789097f4-ffcb-4514-a944-4513c5b63b6a',
        name: 'BE Test Community 106',
      },
      {
        id: 'bb01573c-fc4c-4343-a945-8af1ec9dfb06',
        group_id: '7e7a07e7-067f-4e20-9012-0339bfed4032',
        name: 'BE Test Community 107',
      },
      {
        id: '8db99a3d-071f-45f8-b0df-22933bb5ed78',
        group_id: '79002abb-d030-4ee2-a9fd-61954f0d4619',
        name: 'BE Test Community 108',
      },
      {
        id: 'b54ccf66-6547-4a8e-8e38-fcfa80ec64cd',
        group_id: '63e17cc4-cfe0-4306-9355-e3b8a069f042',
        name: 'BE Test Community 109',
      },
    ];
    const pickedCommunity = testCommunities[generateRandomNumber(0, testCommunities.length - 1)];

    const randomGetTimelineTimes = generateRandomNumber(1, 5);

    let hasNextPage = true;
    let endCursor;

    for (let i = 0; i < randomGetTimelineTimes; i++) {
      if (hasNextPage) {
        const timelineResult = await actor.getTimeline(pickedCommunity.group_id, endCursor);

        if (timelineResult) {
          hasNextPage = timelineResult.meta.has_next_page;
          endCursor = timelineResult.meta.end_cursor;
        } else {
          hasNextPage = false;
        }

        const status = check(timelineResult, {
          'response get timeline code was api.ok': (res) => res?.code == 'api.ok',
        });
        httpagg.checkRequest(timelineResult, status, {
          aggregateLevel: 'all',
        });
      }
    }
  });
}

export function teardown(): void {
  httpagg.generateRaport();
}
