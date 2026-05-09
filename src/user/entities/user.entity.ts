import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { UserRole } from 'src/user-role/entities/user-role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column()
  password!: string;

  /*
    USER <-> ROLE
  */
  @OneToMany(
    () => UserRole,
    (userRole) => userRole.user,
  )
  userRoles!: UserRole[];
}