
export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
  'createWorkspace',
  'invite',
  'login',
  'images',
  'join',
  'profile',
  'share',
  'signup'
];

export function isSpaceDomain (domain: string) {
  return domain && !DOMAIN_BLACKLIST.includes(domain);
}
