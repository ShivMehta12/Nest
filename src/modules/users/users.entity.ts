import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    ManyToOne,
    OneToOne,
    ManyToMany,
    JoinColumn,
    JoinTable,
    Index,

} from 'typeorm';


import { Products } from '../products/entities/product.entity';

@Entity()
export class Users {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 10 })
    firstName: string;


    @Column({ length: 10 })
    lastName: string;


    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    @Column({ default: false })
    isDeleted: boolean;

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

    


    constructor(users: Partial<Users>) {
        Object.assign(this, users);
    }

}