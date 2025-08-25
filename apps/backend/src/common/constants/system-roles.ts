export const SYSTEM_ROLES = {
  // Level 3: Super Administrator (Highest level with all permissions)
  SUPER_ADMIN: 'Super Administrator',

  // Level 2: Administrator (Company admins who sign up for your platform)
  ADMIN: 'Administrator',

  // Level 1: User Admin (User management access with limited permissions)
  USER_ADMIN: 'User Admin',
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const SYSTEM_ROLE_HIERARCHY = {
  // 3-Level Company Hierarchy
  [SYSTEM_ROLES.SUPER_ADMIN]: 3, // Super Administrator - Full system access
  [SYSTEM_ROLES.ADMIN]: 2, // Administrator - Can manage their company only
  [SYSTEM_ROLES.USER_ADMIN]: 1, // User Admin - User management access
} as const;

export const SYSTEM_ROLE_LEVELS = {
  // Level mappings for easy lookup
  3: SYSTEM_ROLES.SUPER_ADMIN, // Super Administrator
  2: SYSTEM_ROLES.ADMIN, // Administrator
  1: SYSTEM_ROLES.USER_ADMIN, // User Admin
} as const;
