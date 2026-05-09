import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { UserRole } from 'src/user-role/entities/user-role.entity';

import { RolePermission } from 'src/role-permission/entities/role-permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({
    unique: true,
  })
  name!: string;

  /*
    USER <-> ROLE
  */
  @OneToMany(
    () => UserRole,
    (userRole) => userRole.role,
  )
  userRoles!: UserRole[];

  /*
    ROLE <-> PERMISSION
  */
  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.role,
  )
  rolePermissions!: RolePermission[];
}