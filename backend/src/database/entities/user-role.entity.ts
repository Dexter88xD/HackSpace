import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum RoleName {
  ROLE_USER = 'ROLE_USER',
  ROLE_ADMIN = 'ROLE_ADMIN',
}

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'role_name',
    type: 'enum',
    enum: RoleName,
  })
  roleName!: RoleName;

  @OneToMany(() => User, (users) => users.role)
  users!: User[];
}
