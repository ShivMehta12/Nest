import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Users } from '../../users/users.entity';

@Entity()
export class Products {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Index()
    @Column({ unique: true })
    sku: string;

    @Column()
    price: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    @Column({ default: false })
    isDeleted: boolean;

    // ✅ Product added by User
    @ManyToOne(() => Users, (user) => user.products, {
        nullable: true,
        onDelete: 'SET NULL'
        // or 'CASCADE' if you want
    })
    @JoinColumn({ name: 'addedById' })
    addedBy: Users;

    constructor(product: Partial<Products>) {
        Object.assign(this, product);
    }
}
