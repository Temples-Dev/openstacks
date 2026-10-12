import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarcField } from './marc-field.entity';

@Entity('marc_subfields')
@Index(['marcField', 'code'])
@Index(['code', 'value'])
export class MarcSubfield {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 1 })
  @Index()
  code: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ name: 'subfield_order', type: 'integer', default: 0 })
  subfieldOrder: number;

  @Column({ name: 'is_repeatable', default: true })
  isRepeatable: boolean;

  // Relations
  @ManyToOne(() => MarcField, marcField => marcField.subfields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'marc_field_id' })
  marcField: MarcField;

  // Helper methods
  get displayValue(): string {
    return this.value?.trim() || '';
  }

  get isNumeric(): boolean {
    return /^\d+$/.test(this.code);
  }

  get isAlphabetic(): boolean {
    return /^[a-zA-Z]$/.test(this.code);
  }
}
