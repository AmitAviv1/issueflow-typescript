import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Restricts a route to the given user roles (e.g. @Roles('ADMIN')).
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
