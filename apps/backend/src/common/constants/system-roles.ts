export const SYSTEM_ROLES = {
  // Level 2: Company Admin (Company admins who sign up for your platform)
  ADMIN: 'ADMIN',
  
  // Level 1: End User (Employees within each company/tenant)
  END_USER: 'END_USER'
} as const;

export type SystemRoleName = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const SYSTEM_ROLE_HIERARCHY = {
  // 2-Level Company Hierarchy
  [SYSTEM_ROLES.ADMIN]: 2,        // Company Admin - Can manage their company only
  [SYSTEM_ROLES.END_USER]: 1      // End User - Regular employee access
} as const;

export const SYSTEM_ROLE_LEVELS = {
  // Level mappings for easy lookup
  2: SYSTEM_ROLES.ADMIN,        // Company Admin  
  1: SYSTEM_ROLES.END_USER      // End User
} as const;