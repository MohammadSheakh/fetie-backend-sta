export type Role = 'user' | 'admin' | 'superAdmin' ; 	
export type RoleType = 'user' | 'admin' | 'superAdmin' | 'common' | 'commonAdmin';

const allRoles: Record<Role, string[]> = {
  user: ['user', 'common'],
  admin: ['admin', 'common', 'commonAdmin'],
  superAdmin: ['superAdmin', 'common', 'commonAdmin']
};

const Roles = Object.keys(allRoles) as Array<keyof typeof allRoles>;

// Map the roles to their corresponding rights
const roleRights = new Map<Role, string[]>(
  Object.entries(allRoles) as [Role, string[]][],
);

export { Roles, roleRights };
