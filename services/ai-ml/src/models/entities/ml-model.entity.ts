import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ModelPrediction } from './model-prediction.entity';

@Entity('ml_models')
@Index(['name'])
@Index(['modelType'])
@Index(['status'])
@Index(['libraryId'])
export class MLModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['recommendation', 'classification', 'prediction', 'anomaly_detection', 'nlp', 'clustering'],
    default: 'recommendation',
  })
  modelType: 'recommendation' | 'classification' | 'prediction' | 'anomaly_detection' | 'nlp' | 'clustering';

  @Column({ length: 50 })
  version: string;

  @Column({
    type: 'enum',
    enum: ['training', 'active', 'deprecated', 'failed'],
    default: 'training',
  })
  status: 'training' | 'active' | 'deprecated' | 'failed';

  @Column({ type: 'uuid' })
  libraryId: string;

  @Column('json')
  configuration: {
    algorithm: string;
    framework: 'tensorflow' | 'scikit_learn' | 'custom';
    parameters: Record<string, any>;
    hyperparameters?: Record<string, any>;
    
    // Training configuration
    trainingData: {
      source: string;
      lastUpdated: Date;
      recordCount: number;
      features: string[];
      targetVariable?: string;
      dataQuality: {
        completeness: number;
        consistency: number;
        accuracy: number;
      };
    };
    
    // Model architecture (for neural networks)
    architecture?: {
      layers: Array<{
        type: string;
        units?: number;
        activation?: string;
        dropout?: number;
      }>;
      optimizer: string;
      lossFunction: string;
      metrics: string[];
    };
    
    // Feature engineering
    featureEngineering?: {
      scalingMethod?: 'standard' | 'minmax' | 'robust';
      encodingMethods?: Record<string, string>;
      dimensionalityReduction?: {
        method: 'pca' | 'lda' | 'tsne';
        components: number;
      };
    };
  };

  @Column('json')
  performance: {
    // Training metrics
    training: {
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1Score?: number;
      rmse?: number;
      mae?: number;
      r2Score?: number;
      auc?: number;
      logloss?: number;
    };
    
    // Validation metrics
    validation: {
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1Score?: number;
      rmse?: number;
      mae?: number;
      r2Score?: number;
      auc?: number;
      logloss?: number;
    };
    
    // Cross-validation results
    crossValidation?: {
      folds: number;
      meanScore: number;
      stdScore: number;
      scores: number[];
    };
    
    // Feature importance
    featureImportance?: Array<{
      feature: string;
      importance: number;
      rank: number;
    }>;
    
    // Confusion matrix (for classification)
    confusionMatrix?: number[][];
    
    // Learning curves
    learningCurves?: {
      trainingSizes: number[];
      trainingScores: number[];
      validationScores: number[];
    };
  };

  @Column('json')
  deployment: {
    modelPath: string;
    modelFormat: 'tensorflow_saved_model' | 'pickle' | 'joblib' | 'onnx';
    servingEndpoint?: string;
    batchSize?: number;
    maxLatency: number; // milliseconds
    memoryUsage: number; // MB
    
    // Scaling configuration
    scaling?: {
      minInstances: number;
      maxInstances: number;
      targetCpuUtilization: number;
      targetMemoryUtilization: number;
    };
    
    // A/B testing
    abTesting?: {
      enabled: boolean;
      trafficSplit: number; // percentage for this model
      challengerModelId?: string;
      testStartDate?: Date;
      testEndDate?: Date;
    };
  };

  @Column('json')
  monitoring: {
    // Data drift detection
    dataDrift: {
      enabled: boolean;
      threshold: number;
      lastCheck?: Date;
      driftScore?: number;
      driftStatus: 'stable' | 'warning' | 'drift_detected';
    };
    
    // Model drift detection
    modelDrift: {
      enabled: boolean;
      threshold: number;
      lastCheck?: Date;
      performanceDecline?: number;
      driftStatus: 'stable' | 'warning' | 'drift_detected';
    };
    
    // Performance monitoring
    performance: {
      requestCount: number;
      averageLatency: number;
      errorRate: number;
      throughput: number;
      lastUpdated: Date;
    };
    
    // Alerts
    alerts: Array<{
      type: 'performance' | 'drift' | 'error' | 'usage';
      threshold: number;
      enabled: boolean;
      recipients: string[];
    }>;
  };

  @Column('json', { nullable: true })
  retraining: {
    schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
    lastRetrained?: Date;
    nextRetraining?: Date;
    autoRetrain: boolean;
    retrainingTriggers: Array<{
      type: 'performance_drop' | 'data_drift' | 'schedule' | 'manual';
      threshold?: number;
      enabled: boolean;
    }>;
    retrainingHistory: Array<{
      version: string;
      retrainedAt: Date;
      trigger: string;
      performanceImprovement: number;
      notes?: string;
    }>;
  };

  @Column('json', { nullable: true })
  explainability: {
    method: 'lime' | 'shap' | 'permutation' | 'custom';
    globalExplanations?: any;
    featureContributions?: Array<{
      feature: string;
      contribution: number;
      description: string;
    }>;
    modelInterpretation?: {
      summary: string;
      keyInsights: string[];
      limitations: string[];
    };
  };

  @OneToMany(() => ModelPrediction, prediction => prediction.model)
  predictions: ModelPrediction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastTrainedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextTrainingAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  // Virtual Properties
  get isActive(): boolean {
    return this.status === 'active';
  }

  get isTraining(): boolean {
    return this.status === 'training';
  }

  get isDeprecated(): boolean {
    return this.status === 'deprecated';
  }

  get hasFailed(): boolean {
    return this.status === 'failed';
  }

  get displayName(): string {
    return `${this.name} v${this.version}`;
  }

  get modelTypeDisplayName(): string {
    const typeMap = {
      recommendation: 'Recommendation Engine',
      classification: 'Classification Model',
      prediction: 'Prediction Model',
      anomaly_detection: 'Anomaly Detection',
      nlp: 'Natural Language Processing',
      clustering: 'Clustering Model',
    };
    return typeMap[this.modelType] || this.modelType;
  }

  get statusDisplayName(): string {
    const statusMap = {
      training: 'Training',
      active: 'Active',
      deprecated: 'Deprecated',
      failed: 'Failed',
    };
    return statusMap[this.status] || this.status;
  }

  get algorithm(): string {
    return this.configuration.algorithm;
  }

  get framework(): string {
    return this.configuration.framework;
  }

  get trainingAccuracy(): number {
    return this.performance.training.accuracy || 0;
  }

  get validationAccuracy(): number {
    return this.performance.validation.accuracy || 0;
  }

  get f1Score(): number {
    return this.performance.validation.f1Score || 0;
  }

  get rmse(): number {
    return this.performance.validation.rmse || 0;
  }

  get featureCount(): number {
    return this.configuration.trainingData.features.length;
  }

  get trainingDataSize(): number {
    return this.configuration.trainingData.recordCount;
  }

  get lastTrainingDate(): Date | null {
    return this.lastTrainedAt ? new Date(this.lastTrainedAt) : null;
  }

  get daysSinceLastTraining(): number {
    if (!this.lastTrainedAt) return Infinity;
    const now = new Date();
    const diffTime = now.getTime() - this.lastTrainedAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get needsRetraining(): boolean {
    if (!this.retraining) return false;
    
    // Check if scheduled retraining is due
    if (this.nextTrainingAt && new Date() >= this.nextTrainingAt) {
      return true;
    }
    
    // Check performance-based triggers
    const performanceTrigger = this.retraining.retrainingTriggers.find(t => t.type === 'performance_drop' && t.enabled);
    if (performanceTrigger && this.validationAccuracy < performanceTrigger.threshold) {
      return true;
    }
    
    // Check data drift
    if (this.monitoring.dataDrift.driftStatus === 'drift_detected') {
      return true;
    }
    
    return false;
  }

  get averageLatency(): number {
    return this.monitoring.performance.averageLatency || 0;
  }

  get errorRate(): number {
    return this.monitoring.performance.errorRate || 0;
  }

  get requestCount(): number {
    return this.monitoring.performance.requestCount || 0;
  }

  get dataDriftStatus(): string {
    return this.monitoring.dataDrift.driftStatus;
  }

  get modelDriftStatus(): string {
    return this.monitoring.modelDrift.driftStatus;
  }

  get hasDataDrift(): boolean {
    return this.dataDriftStatus === 'drift_detected';
  }

  get hasModelDrift(): boolean {
    return this.modelDriftStatus === 'drift_detected';
  }

  get topFeatures(): Array<{ feature: string; importance: number }> {
    const features = this.performance.featureImportance || [];
    return features.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  get modelSize(): number {
    return this.deployment.memoryUsage || 0;
  }

  get isABTesting(): boolean {
    return this.deployment.abTesting?.enabled || false;
  }

  get trafficSplit(): number {
    return this.deployment.abTesting?.trafficSplit || 100;
  }

  get retrainingHistory(): any[] {
    return this.retraining?.retrainingHistory || [];
  }

  get lastRetrainingImprovement(): number {
    const history = this.retrainingHistory;
    return history.length > 0 ? history[history.length - 1].performanceImprovement : 0;
  }

  // Helper Methods
  updatePerformanceMetrics(metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
    r2Score?: number;
    auc?: number;
  }, isValidation: boolean = true): void {
    const target = isValidation ? this.performance.validation : this.performance.training;
    Object.assign(target, metrics);
  }

  updateMonitoringMetrics(
    requestCount: number,
    averageLatency: number,
    errorRate: number,
    throughput: number
  ): void {
    this.monitoring.performance = {
      requestCount,
      averageLatency,
      errorRate,
      throughput,
      lastUpdated: new Date(),
    };
  }

  checkDataDrift(driftScore: number): void {
    this.monitoring.dataDrift.lastCheck = new Date();
    this.monitoring.dataDrift.driftScore = driftScore;
    
    if (driftScore > this.monitoring.dataDrift.threshold) {
      this.monitoring.dataDrift.driftStatus = 'drift_detected';
    } else if (driftScore > this.monitoring.dataDrift.threshold * 0.8) {
      this.monitoring.dataDrift.driftStatus = 'warning';
    } else {
      this.monitoring.dataDrift.driftStatus = 'stable';
    }
  }

  checkModelDrift(performanceDecline: number): void {
    this.monitoring.modelDrift.lastCheck = new Date();
    this.monitoring.modelDrift.performanceDecline = performanceDecline;
    
    if (performanceDecline > this.monitoring.modelDrift.threshold) {
      this.monitoring.modelDrift.driftStatus = 'drift_detected';
    } else if (performanceDecline > this.monitoring.modelDrift.threshold * 0.8) {
      this.monitoring.modelDrift.driftStatus = 'warning';
    } else {
      this.monitoring.modelDrift.driftStatus = 'stable';
    }
  }

  scheduleRetraining(schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly'): void {
    if (!this.retraining) {
      this.retraining = {
        schedule: 'manual',
        autoRetrain: false,
        retrainingTriggers: [],
        retrainingHistory: [],
      };
    }
    
    this.retraining.schedule = schedule;
    
    if (schedule !== 'manual') {
      const now = new Date();
      switch (schedule) {
        case 'daily':
          this.nextTrainingAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          this.nextTrainingAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          this.nextTrainingAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        case 'quarterly':
          this.nextTrainingAt = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
          break;
      }
    }
  }

  addRetrainingHistory(trigger: string, performanceImprovement: number, notes?: string): void {
    if (!this.retraining) {
      this.retraining = {
        schedule: 'manual',
        autoRetrain: false,
        retrainingTriggers: [],
        retrainingHistory: [],
      };
    }
    
    this.retraining.retrainingHistory.push({
      version: this.version,
      retrainedAt: new Date(),
      trigger,
      performanceImprovement,
      notes,
    });
    
    // Keep only last 10 retraining records
    this.retraining.retrainingHistory = this.retraining.retrainingHistory.slice(-10);
    
    this.lastTrainedAt = new Date();
  }

  enableABTesting(trafficSplit: number, challengerModelId?: string, testDuration?: number): void {
    const startDate = new Date();
    const endDate = testDuration ? new Date(startDate.getTime() + testDuration * 24 * 60 * 60 * 1000) : undefined;
    
    this.deployment.abTesting = {
      enabled: true,
      trafficSplit,
      challengerModelId,
      testStartDate: startDate,
      testEndDate: endDate,
    };
  }

  disableABTesting(): void {
    if (this.deployment.abTesting) {
      this.deployment.abTesting.enabled = false;
    }
  }

  addAlert(
    type: 'performance' | 'drift' | 'error' | 'usage',
    threshold: number,
    recipients: string[]
  ): void {
    this.monitoring.alerts.push({
      type,
      threshold,
      enabled: true,
      recipients,
    });
  }

  getModelSummary(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.modelType,
      version: this.version,
      status: this.status,
      algorithm: this.algorithm,
      framework: this.framework,
      performance: {
        accuracy: this.validationAccuracy,
        f1Score: this.f1Score,
        rmse: this.rmse,
      },
      training: {
        lastTrained: this.lastTrainingDate,
        dataSize: this.trainingDataSize,
        featureCount: this.featureCount,
      },
      monitoring: {
        requestCount: this.requestCount,
        averageLatency: this.averageLatency,
        errorRate: this.errorRate,
        dataDrift: this.dataDriftStatus,
        modelDrift: this.modelDriftStatus,
      },
      deployment: {
        modelSize: this.modelSize,
        isABTesting: this.isABTesting,
        trafficSplit: this.trafficSplit,
      },
    };
  }

  canMakePredictions(): boolean {
    return this.isActive && this.deployment.modelPath && this.averageLatency < this.deployment.maxLatency;
  }

  getHealthScore(): number {
    let score = 100;
    
    // Deduct for performance issues
    if (this.errorRate > 0.05) score -= 20;
    if (this.averageLatency > this.deployment.maxLatency) score -= 15;
    
    // Deduct for drift
    if (this.hasDataDrift) score -= 25;
    if (this.hasModelDrift) score -= 25;
    
    // Deduct for outdated training
    if (this.daysSinceLastTraining > 90) score -= 10;
    
    // Deduct for low performance
    if (this.validationAccuracy < 0.8) score -= 15;
    
    return Math.max(0, score);
  }

  getRecommendedActions(): string[] {
    const actions: string[] = [];
    
    if (this.needsRetraining) {
      actions.push('Schedule model retraining');
    }
    
    if (this.hasDataDrift) {
      actions.push('Investigate data drift and update training data');
    }
    
    if (this.hasModelDrift) {
      actions.push('Review model performance and consider architecture changes');
    }
    
    if (this.errorRate > 0.05) {
      actions.push('Investigate and fix prediction errors');
    }
    
    if (this.averageLatency > this.deployment.maxLatency) {
      actions.push('Optimize model for better latency');
    }
    
    if (this.validationAccuracy < 0.8) {
      actions.push('Improve model accuracy through feature engineering or algorithm tuning');
    }
    
    return actions;
  }
}
