export const SYSTEM_ROLES = {
  
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const;

export type SystemRoleName = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const SYSTEM_ROLE_HIERARCHY = {
  
  [SYSTEM_ROLES.ADMIN]: 2,
  [SYSTEM_ROLES.USER]: 1
} as const;

export const SYSTEM_ROLE_LEVELS = {
  
  2: SYSTEM_ROLES.ADMIN,
  1: SYSTEM_ROLES.USER
} as const;