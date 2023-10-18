import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { Page as BrowserPage } from '@playwright/test';
import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { baseUrl } from 'config/constants';
import { memberProfileNames } from 'lib/profile/memberProfiles';
import { createUserFromWallet } from 'lib/users/createUser';
import type { LoggedInUser } from 'models';
import { createPage } from 'testing/setupDatabase';

export async function loginBrowserUser({
  browserPage,
  userId
}: {
  browserPage: BrowserPage;
  userId: string;
}): Promise<LoggedInUser> {
  return browserPage.request
    .post(`${baseUrl}/api/profile/dev`, {
      data: {
        userId
      }
    })
    .then((res) => res.json());
}

export async function logoutBrowserUser({ browserPage }: { browserPage: BrowserPage }): Promise<void> {
  await browserPage.request.post(`${baseUrl}/api/session/logout`);
}

/**
 * @deprecated - mock data should be generated directly, not using webapp features. Use generateUser instead
 */
export async function createUser({
  browserPage,
  address
}: {
  browserPage: BrowserPage;
  address: string;
}): Promise<LoggedInUser> {
  return browserPage.request
    .post(`${baseUrl}/api/profile/dev`, {
      data: {
        address
      }
    })
    .then((res) => res.json());
}

/**
 * @deprecated - mock data should be generated directly, not using webapp features
 */
export async function createSpace({
  browserPage,
  permissionConfigurationMode,
  paidTier
}: { browserPage: BrowserPage } & Pick<Space, 'createdBy'> &
  Partial<Pick<Space, 'permissionConfigurationMode' | 'paidTier'>>): Promise<Space> {
  const space: Space = await browserPage.request
    .post(`${baseUrl}/api/spaces`, {
      data: {
        spaceData: {
          name: 'Testing space',
          permissionConfigurationMode
        }
      }
    })
    .then((res) => res.json());

  // Added this here instead of the API controller, so that we can control in prod which paid tier we initialise spaces with
  if (paidTier) {
    return prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        paidTier
      }
    });
  } else {
    return space;
  }
}

/**
 * @deprecated - mock data should be generated directly, not using webapp features
 */
export async function getPages({
  browserPage,
  spaceId
}: {
  browserPage: BrowserPage;
  spaceId: string;
}): Promise<PageWithPermissions[]> {
  return browserPage.request.get(`${baseUrl}/api/spaces/${spaceId}/pages`).then((res) => res.json());
}

/**
 *
 * @deprecated - Use generateUserAndSpace() instead. Mock data should be generated directly, not using webapp features
 *
 * @browserPage - the page object for the browser context that will execute the requests
 *
 * @isOnboarded Default to true so all user / space pairs start as onboarded, and the tester can focus on the happy path they are targeting
 *
 *
 * By Default, the user created with this method will be a space admin
 *
 * Returns a user and space along with this space's pages
 */
export async function createUserAndSpace({
  browserPage,
  permissionConfigurationMode = 'collaborative',
  isOnboarded = true,
  paidTier
}: {
  browserPage: BrowserPage;
} & Partial<Pick<Space, 'permissionConfigurationMode' | 'paidTier'>> & { isOnboarded?: boolean }): Promise<{
  user: LoggedInUser;
  address: string;
  privateKey: string;
  space: Space;
  pages: PageWithPermissions[];
}> {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const user = await createUser({ browserPage, address });
  const space = await createSpace({ browserPage, createdBy: user.id, permissionConfigurationMode, paidTier });
  const pages = await getPages({ browserPage, spaceId: space.id });

  const updatedRole = await prisma.spaceRole.update({
    where: {
      spaceUser: {
        spaceId: space.id,
        userId: user.id
      }
    },
    data: {
      onboarded: isOnboarded
    },
    include: {
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user.spaceRoles.some((sr) => sr.id === updatedRole.id)) {
    user.spaceRoles.push(updatedRole);
  } else {
    user.spaceRoles = user.spaceRoles.map((r) => {
      if (r.id !== updatedRole.id) {
        return r;
      } else {
        return updatedRole;
      }
    });
  }

  return {
    space,
    address,
    privateKey: wallet.privateKey,
    user,
    pages
  };
}

export async function generateUser({ walletAddress = Wallet.createRandom().address }: { walletAddress?: string } = {}) {
  const user = await prisma.user.create({
    data: {
      identityType: 'Wallet',
      username: v4(),
      path: v4(),
      wallets: {
        create: {
          address: walletAddress
        }
      }
    }
  });

  return user;
}

export async function generateDiscordUser() {
  const user = await prisma.user.create({
    data: {
      identityType: 'Wallet',
      username: v4(),
      path: v4(),
      discordUser: {
        create: {
          account: {},
          discordId: v4()
        }
      }
    }
  });

  return user;
}

export async function generateSpaceRole({
  spaceId,
  userId,
  isAdmin = false,
  // Defaults to true so that users dont see the onboarding experience
  isOnboarded = true
}: {
  userId: string;
  spaceId: string;
  isAdmin?: boolean;
  isOnboarded?: boolean;
}) {
  return prisma.spaceRole.create({
    data: {
      isAdmin,
      space: { connect: { id: spaceId } },
      user: { connect: { id: userId } },
      onboarded: isOnboarded
    }
  });
}

type UserAndSpaceInput = {
  isAdmin?: boolean;
  onboarded?: boolean;
  spaceName?: string;
  publicBountyBoard?: boolean;
  skipOnboarding?: boolean;
  email?: string;
};

export async function generateUserAndSpace({
  isAdmin,
  spaceName = 'Example Space',
  publicBountyBoard,
  skipOnboarding = true,
  email = `${v4()}@gmail.com`
}: UserAndSpaceInput = {}) {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const user = await createUserFromWallet({ address, email });

  const existingSpaceId = user.spaceRoles?.[0]?.spaceId;

  let space: Space;
  const spaceId = v4();

  if (existingSpaceId) {
    space = await prisma.space.findUniqueOrThrow({
      where: { id: user.spaceRoles?.[0]?.spaceId },
      include: { apiToken: true, spaceRoles: true }
    });
  } else {
    space = await prisma.space.create({
      data: {
        id: spaceId,
        name: spaceName,
        // Adding prefix avoids this being evaluated as uuid
        domain: `domain-${v4()}`,
        author: {
          connect: {
            id: user.id
          }
        },
        publicBountyBoard,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        memberProfiles: memberProfileNames.map((name) => ({ id: name, isHidden: false })),
        features: STATIC_PAGES.map((page) => ({ id: page.feature, isHidden: false })),
        spaceRoles: {
          create: {
            userId: user.id,
            isAdmin,
            // skip onboarding for normal test users
            onboarded: skipOnboarding
          }
        },
        permittedGroups: {
          create: {
            operations: ['reviewProposals'],
            spaceId
          }
        }
      }
    });
  }

  const page = await createPage({
    spaceId: space.id,
    createdBy: user.id,
    title: 'Test Page',
    pagePermissions: [
      {
        spaceId: space.id,
        permissionLevel: 'full_access'
      }
    ]
  });

  return {
    page,
    user,
    space,
    address,
    privateKey: wallet.privateKey
  };
}

export type UserAndSpaceContext = Awaited<ReturnType<typeof generateUserAndSpace>>;
