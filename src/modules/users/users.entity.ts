import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Products } from '../products/entities/product.entity';
import { UserRole } from '../../common/enums/role.enum';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50, nullable: true })
  lastName: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'varchar',
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Users, (user) => user.createdUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'addedById' })
  addedBy: Users;

  @OneToMany(() => Users, (user) => user.addedBy)
  createdUsers: Users[];

  @OneToMany(() => Products, (product) => product.addedBy)
  products: Products[];

  constructor(partial?: Partial<Users>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
