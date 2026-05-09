import {
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { User } from 'src/user/entities/user.entity';

import { Role } from 'src/role/entities/role.entity';

@Entity('user_roles')
export class UserRole extends BaseEntity {
  /*
    USER
  */
  @ManyToOne(
    () => User,
    (user) => user.userRoles,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;

  /*
    ROLE
  */
  @ManyToOne(
    () => Role,
    (role) => role.userRoles,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'role_id',
  })
  role!: Role;
}