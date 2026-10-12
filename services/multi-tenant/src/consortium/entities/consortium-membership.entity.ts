import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LibrarySystem } from '../../library-systems/entities/library-system.entity';

@Entity('consortium_memberships')
export class ConsortiumMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LibrarySystem, system => system.consortiumMemberships)
  @JoinColumn({ name: 'librarySystemId' })
  librarySystem: LibrarySystem;

  @Column({ type: 'uuid' })
  librarySystemId: string;

  @Column({ type: 'uuid' })
  consortiumId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'pending', 'suspended', 'withdrawn'],
    default: 'pending',
  })
  status: 'active' | 'pending' | 'suspended' | 'withdrawn';

  @Column({ type: 'date' })
  joinedDate: Date;

  @Column({ type: 'date', nullable: true })
  withdrawalDate: Date;

  @Column('json')
  membershipTerms: {
    votingRights: boolean;
    votingWeight: number;
    costSharingPercentage: number;
    serviceAccess: string[];
    dataSharing: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
