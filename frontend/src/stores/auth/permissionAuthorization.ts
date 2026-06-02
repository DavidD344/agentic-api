
export type Authorization = 'OWNER' | 'ADMIN' | 'USER';

export enum AuthorizationEnum {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export function permissionAuthorization({
  permissions,
  user,
}: {
  permissions: AuthorizationEnum[];
  user: Authorization;
}): boolean {
  if (permissions.length === 0) {
    return true;
  }
  return permissions.includes(user as AuthorizationEnum);
}
