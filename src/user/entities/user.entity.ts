import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { UserRole } from 'src/user-role/entities/user-role.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

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

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender!: Gender;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];
}
