import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MLModel } from './ml-model.entity';

@Entity('model_predictions')
@Index(['modelId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['predictionType'])
export class ModelPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MLModel, model => model.predictions)
  @JoinColumn({ name: 'modelId' })
  model: MLModel;

  @Column({ type: 'uuid' })
  modelId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['recommendation', 'classification', 'prediction', 'anomaly_score', 'sentiment', 'clustering'],
  })
  predictionType: 'recommendation' | 'classification' | 'prediction' | 'anomaly_score' | 'sentiment' | 'clustering';

  @Column('json')
  inputData: {
    features: Record<string, any>;
    context?: {
      sessionId?: string;
      timestamp: Date;
      location?: string;
      deviceType?: string;
    };
  };

  @Column('json')
  outputData: {
    predictions: Array<{
      value: any;
      confidence: number;
      probability?: number;
      rank?: number;
    }>;
    metadata?: {
      processingTime: number;
      modelVersion: string;
      explanation?: any;
    };
  };

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  confidence: number;

  @Column({ type: 'integer' })
  processingTimeMs: number;

  @Column({ type: 'boolean', default: false })
  feedbackReceived: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  feedbackScore: number; // 1-5 rating

  @Column({ type: 'text', nullable: true })
  feedbackComments: string;

  @CreateDateColumn()
  createdAt: Date;

  // Virtual Properties
  get isHighConfidence(): boolean {
    return this.confidence >= 0.8;
  }

  get isMediumConfidence(): boolean {
    return this.confidence >= 0.6 && this.confidence < 0.8;
  }

  get isLowConfidence(): boolean {
    return this.confidence < 0.6;
  }

  get confidenceLevel(): 'high' | 'medium' | 'low' {
    if (this.isHighConfidence) return 'high';
    if (this.isMediumConfidence) return 'medium';
    return 'low';
  }

  get topPrediction(): any {
    return this.outputData.predictions[0];
  }

  get processingTimeSeconds(): number {
    return this.processingTimeMs / 1000;
  }

  get hasFeedback(): boolean {
    return this.feedbackReceived;
  }

  get isPositiveFeedback(): boolean {
    return this.feedbackScore ? this.feedbackScore >= 3 : false;
  }
}
