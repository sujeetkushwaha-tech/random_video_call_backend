import {
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { Role } from 'src/role/entities/role.entity';

import { Permission } from 'src/permission/permission.entity';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  /*
    ROLE
  */
  @ManyToOne(
    () => Role,
    (role) => role.rolePermissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'role_id',
  })
  role!: Role;

  /*
    PERMISSION
  */
  @ManyToOne(
    () => Permission,
    (permission) => permission.rolePermissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'permission_id',
  })
  permission!: Permission;
}