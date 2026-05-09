import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { RolePermission } from 'src/role-permission/entities/role-permission.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({
    unique: true,
  })
  name!: string;

  /*
    ROLE <-> PERMISSION
  */
  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions!: RolePermission[];
}