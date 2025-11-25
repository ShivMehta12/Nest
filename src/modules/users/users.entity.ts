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

@Entity()
export class Users {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 10 })
    firstName: string;


    @Column({ length: 10 })
    lastName: string;

    @Index()
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

    constructor(users: Partial<Users>){
        Object.assign(this, users);
    }

}