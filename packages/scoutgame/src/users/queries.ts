import type { Prisma } from '@charmverse/core/prisma-client';

export const BasicUserInfoSelect = {
  id: true,
  path: true,
  displayName: true,
  onboardedAt: true,
  agreedToTermsAt: true,
  farcasterName: true,
  currentBalance: true,
  avatar: true,
  bio: true,
  referralCode: true,
  githubUser: {
    select: {
      login: true
    }
  },
  builderStatus: true
} satisfies Prisma.ScoutSelect;

export const MinimalScoutInfoSelect = {
  id: true,
  path: true,
  avatar: true,
  displayName: true
} satisfies Prisma.ScoutSelect;
