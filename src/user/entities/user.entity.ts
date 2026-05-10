import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { UserRole } from 'src/user-role/entities/user-role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({
    nullable: true,
  })
  name!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column({
    nullable: true,
  })
  password?: string;

  @Column({
    nullable: true,
  })
  image!: string;

  @Column({
    nullable: true,
  })
  provider!: string;

  @Column({
    default: false,
  })
  isEmailVerified!: boolean;

  @Column({
    nullable: true,
  })
  refreshToken!: string;

  /*
    USER <-> ROLE
  */
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];
}
