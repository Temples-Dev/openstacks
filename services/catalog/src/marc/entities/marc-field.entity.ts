import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarcRecord } from './marc-record.entity';
import { MarcSubfield } from './marc-subfield.entity';

@Entity('marc_fields')
@Index(['marcRecord', 'tag'])
@Index(['tag', 'indicator1', 'indicator2'])
export class MarcField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 3 })
  @Index()
  tag: string;

  @Column({ name: 'indicator1', length: 1, default: ' ' })
  indicator1: string;

  @Column({ name: 'indicator2', length: 1, default: ' ' })
  indicator2: string;

  @Column({ type: 'text', nullable: true })
  value: string; // For control fields (001-009)

  @Column({ name: 'field_order', type: 'integer', default: 0 })
  fieldOrder: number;

  @Column({ name: 'is_repeatable', default: true })
  isRepeatable: boolean;

  // Relations
  @ManyToOne(() => MarcRecord, marcRecord => marcRecord.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'marc_record_id' })
  marcRecord: MarcRecord;

  @OneToMany(() => MarcSubfield, subfield => subfield.marcField, {
    cascade: true,
    eager: false,
  })
  subfields: MarcSubfield[];

  // Helper methods
  get isControlField(): boolean {
    const tagNum = parseInt(this.tag);
    return tagNum >= 1 && tagNum <= 9;
  }

  get isDataField(): boolean {
    return !this.isControlField;
  }

  getSubfield(code: string): MarcSubfield | undefined {
    return this.subfields?.find(subfield => subfield.code === code);
  }

  getSubfields(code: string): MarcSubfield[] {
    return this.subfields?.filter(subfield => subfield.code === code) || [];
  }

  getAllSubfieldValues(): string {
    if (this.isControlField) {
      return this.value || '';
    }
    
    return this.subfields
      ?.map(subfield => subfield.value)
      .join(' ') || '';
  }

  getFormattedField(): string {
    if (this.isControlField) {
      return this.value || '';
    }

    const subfieldStr = this.subfields
      ?.map(subfield => `$${subfield.code}${subfield.value}`)
      .join('') || '';

    return `${this.indicator1}${this.indicator2}${subfieldStr}`;
  }
}
