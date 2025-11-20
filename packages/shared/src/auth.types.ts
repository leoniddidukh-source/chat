export type Role = 'admin' | 'user' | 'manager';

export interface User {
  id: string;
  name: string;
  role: Role;
  permissions: string[];
  email?: string;
}

