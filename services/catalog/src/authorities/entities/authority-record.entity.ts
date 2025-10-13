import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('authority_records')
@Index(['authorityType', 'isActive'])
@Index(['headingMain'])
@Index(['controlNumber'])
export class AuthorityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'authority_type', length: 50 })
  @Index()
  authorityType: 'personal_name' | 'corporate_name' | 'meeting_name' | 'uniform_title' | 'topical_term' | 'geographic_name' | 'genre_form';

  @Column({ name: 'control_number', length: 50, nullable: true })
  @Index()
  controlNumber: string;

  @Column({ name: 'heading_main', length: 500 })
  @Index()
  headingMain: string;

  @Column({ name: 'heading_subdivision', length: 500, nullable: true })
  headingSubdivision: string;

  @Column({ name: 'see_also_from', type: 'text', nullable: true })
  seeAlsoFrom: string; // JSON array of cross-references

  @Column({ name: 'see_from', type: 'text', nullable: true })
  seeFrom: string; // JSON array of see references

  @Column({ name: 'scope_note', type: 'text', nullable: true })
  scopeNote: string;

  @Column({ name: 'history_note', type: 'text', nullable: true })
  historyNote: string;

  @Column({ name: 'general_note', type: 'text', nullable: true })
  generalNote: string;

  @Column({ name: 'source_data', type: 'text', nullable: true })
  sourceData: string;

  @Column({ name: 'birth_date', length: 20, nullable: true })
  birthDate: string;

  @Column({ name: 'death_date', length: 20, nullable: true })
  deathDate: string;

  @Column({ name: 'associated_place', length: 200, nullable: true })
  associatedPlace: string;

  @Column({ name: 'associated_institution', length: 200, nullable: true })
  associatedInstitution: string;

  @Column({ name: 'occupation', length: 200, nullable: true })
  occupation: string;

  @Column({ name: 'field_of_activity', length: 200, nullable: true })
  fieldOfActivity: string;

  @Column({ name: 'language_code', length: 10, nullable: true })
  languageCode: string;

  @Column({ name: 'cataloging_source', length: 50, nullable: true })
  catalogingSource: string;

  @Column({ name: 'cataloging_agency', length: 50, nullable: true })
  catalogingAgency: string;

  @Column({ name: 'transcribing_agency', length: 50, nullable: true })
  transcribingAgency: string;

  @Column({ name: 'modifying_agency', length: 50, nullable: true })
  modifyingAgency: string;

  @Column({ name: 'authentication_code', length: 10, nullable: true })
  authenticationCode: string;

  @Column({ name: 'proprietary_code', length: 20, nullable: true })
  proprietaryCode: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_established', default: false })
  isEstablished: boolean;

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_date', type: 'timestamp', nullable: true })
  lastUsedDate: Date;

  @Column({ name: 'marc_record_id', length: 36, nullable: true })
  marcRecordId: string;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'last_modified_by', length: 100, nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Virtual properties
  get fullHeading(): string {
    if (this.headingSubdivision) {
      return `${this.headingMain} -- ${this.headingSubdivision}`;
    }
    return this.headingMain;
  }

  get displayName(): string {
    switch (this.authorityType) {
      case 'personal_name':
        let name = this.headingMain;
        if (this.birthDate || this.deathDate) {
          const dates = [];
          if (this.birthDate) dates.push(this.birthDate);
          if (this.deathDate) dates.push(this.deathDate);
          name += ` (${dates.join('-')})`;
        }
        return name;
      
      case 'corporate_name':
        let corp = this.headingMain;
        if (this.associatedPlace) {
          corp += ` (${this.associatedPlace})`;
        }
        return corp;
      
      default:
        return this.fullHeading;
    }
  }

  get seeAlsoFromArray(): string[] {
    if (!this.seeAlsoFrom) return [];
    try {
      return JSON.parse(this.seeAlsoFrom);
    } catch {
      return [];
    }
  }

  get seeFromArray(): string[] {
    if (!this.seeFrom) return [];
    try {
      return JSON.parse(this.seeFrom);
    } catch {
      return [];
    }
  }

  get isPersonalName(): boolean {
    return this.authorityType === 'personal_name';
  }

  get isCorporateName(): boolean {
    return this.authorityType === 'corporate_name';
  }

  get isSubjectHeading(): boolean {
    return ['topical_term', 'geographic_name', 'genre_form'].includes(this.authorityType);
  }

  get hasLifeDates(): boolean {
    return !!(this.birthDate || this.deathDate);
  }

  get isFrequentlyUsed(): boolean {
    return this.usageCount >= 10;
  }

  get daysSinceLastUse(): number {
    if (!this.lastUsedDate) return null;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastUsedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
