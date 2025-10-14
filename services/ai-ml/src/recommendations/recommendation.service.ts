import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { MLModel } from '../models/entities/ml-model.entity';
import { ModelPrediction } from '../models/entities/model-prediction.entity';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(MLModel)
    private readonly mlModelRepository: Repository<MLModel>,
    @InjectRepository(ModelPrediction)
    private readonly predictionRepository: Repository<ModelPrediction>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Patron Recommendation Engine
  async generatePersonalizedRecommendations(
    patronId: string,
    options: {
      count?: number;
      includeTypes?: string[];
      excludeTypes?: string[];
      minConfidence?: number;
      diversityFactor?: number;
    } = {}
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating personalized recommendations for patron: ${patronId}`);

      // Get patron's borrowing history and preferences
      const patronData = await this.getPatronData(patronId);
      
      // Get active recommendation model
      const model = await this.getActiveModel('recommendation');
      if (!model) {
        this.logger.warn('No active recommendation model found');
        return this.getFallbackRecommendations(patronId, options);
      }

      // Prepare input features
      const inputFeatures = await this.prepareRecommendationFeatures(patronData, options);

      // Generate predictions
      const predictions = await this.makePrediction(model, inputFeatures, 'recommendation');

      // Post-process and rank recommendations
      const recommendations = await this.postProcessRecommendations(
        predictions,
        patronData,
        options
      );

      // Store prediction for feedback and monitoring
      await this.storePrediction(model.id, patronId, inputFeatures, predictions, 'recommendation');

      this.logger.log(`Generated ${recommendations.length} recommendations for patron ${patronId}`);
      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to generate recommendations for patron ${patronId}: ${error.message}`, error.stack);
      return this.getFallbackRecommendations(patronId, options);
    }
  }

  // Collection Development Recommendations
  async generateCollectionRecommendations(
    libraryId: string,
    options: {
      budget?: number;
      subjects?: string[];
      formats?: string[];
      targetAudience?: string[];
      analysisType?: 'demand_prediction' | 'gap_analysis' | 'trend_analysis';
    } = {}
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating collection recommendations for library: ${libraryId}`);

      // Get library collection data and usage patterns
      const libraryData = await this.getLibraryData(libraryId);
      
      // Get active prediction model
      const model = await this.getActiveModel('prediction');
      if (!model) {
        this.logger.warn('No active prediction model found for collection development');
        return [];
      }

      // Prepare input features for collection analysis
      const inputFeatures = await this.prepareCollectionFeatures(libraryData, options);

      // Generate predictions
      const predictions = await this.makePrediction(model, inputFeatures, 'prediction');

      // Process collection recommendations
      const recommendations = await this.processCollectionRecommendations(
        predictions,
        libraryData,
        options
      );

      // Store prediction
      await this.storePrediction(model.id, null, inputFeatures, predictions, 'prediction');

      this.logger.log(`Generated ${recommendations.length} collection recommendations for library ${libraryId}`);
      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to generate collection recommendations: ${error.message}`, error.stack);
      return [];
    }
  }

  // Content-Based Filtering
  async generateContentBasedRecommendations(
    itemId: string,
    options: {
      count?: number;
      similarityThreshold?: number;
      includeMetadata?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating content-based recommendations for item: ${itemId}`);

      // Get item metadata and features
      const itemData = await this.getItemData(itemId);
      
      // Get content similarity model
      const model = await this.getActiveModel('clustering');
      if (!model) {
        return this.getContentSimilarityFallback(itemId, options);
      }

      // Find similar items using clustering/similarity model
      const inputFeatures = await this.prepareContentFeatures(itemData);
      const predictions = await this.makePrediction(model, inputFeatures, 'clustering');

      // Process similar items
      const recommendations = await this.processContentRecommendations(
        predictions,
        itemData,
        options
      );

      await this.storePrediction(model.id, null, inputFeatures, predictions, 'clustering');

      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to generate content-based recommendations: ${error.message}`, error.stack);
      return this.getContentSimilarityFallback(itemId, options);
    }
  }

  // Collaborative Filtering
  async generateCollaborativeRecommendations(
    patronId: string,
    options: {
      count?: number;
      neighborCount?: number;
      minCommonItems?: number;
    } = {}
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating collaborative recommendations for patron: ${patronId}`);

      // Find similar patrons
      const similarPatrons = await this.findSimilarPatrons(patronId, options.neighborCount || 50);
      
      // Get items liked by similar patrons
      const candidateItems = await this.getCandidateItemsFromSimilarPatrons(
        patronId,
        similarPatrons,
        options
      );

      // Score and rank recommendations
      const recommendations = await this.scoreCollaborativeRecommendations(
        patronId,
        candidateItems,
        similarPatrons,
        options
      );

      return recommendations.slice(0, options.count || 10);

    } catch (error) {
      this.logger.error(`Failed to generate collaborative recommendations: ${error.message}`, error.stack);
      return [];
    }
  }

  // Hybrid Recommendations (combining multiple approaches)
  async generateHybridRecommendations(
    patronId: string,
    options: {
      count?: number;
      contentWeight?: number;
      collaborativeWeight?: number;
      personalizedWeight?: number;
      diversityBoost?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating hybrid recommendations for patron: ${patronId}`);

      const {
        contentWeight = 0.3,
        collaborativeWeight = 0.4,
        personalizedWeight = 0.3,
        count = 10,
        diversityBoost = true,
      } = options;

      // Generate recommendations from different approaches
      const [personalizedRecs, collaborativeRecs] = await Promise.all([
        this.generatePersonalizedRecommendations(patronId, { count: count * 2 }),
        this.generateCollaborativeRecommendations(patronId, { count: count * 2 }),
      ]);

      // Get content-based recommendations for patron's recent items
      const recentItems = await this.getPatronRecentItems(patronId, 5);
      const contentRecs = [];
      
      for (const item of recentItems) {
        const itemRecs = await this.generateContentBasedRecommendations(item.id, { count: 5 });
        contentRecs.push(...itemRecs);
      }

      // Combine and score recommendations
      const hybridRecs = await this.combineRecommendations(
        {
          personalized: personalizedRecs,
          collaborative: collaborativeRecs,
          content: contentRecs,
        },
        {
          personalizedWeight,
          collaborativeWeight,
          contentWeight,
        }
      );

      // Apply diversity if requested
      let finalRecs = hybridRecs;
      if (diversityBoost) {
        finalRecs = await this.applyDiversityBoost(hybridRecs, patronId);
      }

      return finalRecs.slice(0, count);

    } catch (error) {
      this.logger.error(`Failed to generate hybrid recommendations: ${error.message}`, error.stack);
      return this.getFallbackRecommendations(patronId, options);
    }
  }

  // Trending and Popular Items
  async generateTrendingRecommendations(
    libraryId: string,
    options: {
      timeWindow?: 'day' | 'week' | 'month' | 'quarter';
      count?: number;
      categories?: string[];
      minPopularity?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const { timeWindow = 'week', count = 20 } = options;
      
      // Get trending items based on circulation and engagement data
      const trendingData = await this.getTrendingData(libraryId, timeWindow);
      
      // Apply trend analysis model if available
      const model = await this.getActiveModel('prediction');
      if (model) {
        const predictions = await this.makePrediction(
          model,
          { trendingData, timeWindow, libraryId },
          'prediction'
        );
        
        return this.processTrendingPredictions(predictions, options);
      }

      // Fallback to simple trending calculation
      return this.calculateSimpleTrending(trendingData, options);

    } catch (error) {
      this.logger.error(`Failed to generate trending recommendations: ${error.message}`, error.stack);
      return [];
    }
  }

  // Utility Methods
  private async getActiveModel(modelType: string): Promise<MLModel | null> {
    return this.mlModelRepository.findOne({
      where: {
        modelType: modelType as any,
        status: 'active',
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async makePrediction(
    model: MLModel,
    inputFeatures: any,
    predictionType: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Call ML model endpoint or local prediction service
      const response = await this.httpService.post(
        model.deployment.servingEndpoint || `${this.configService.get('ML_SERVICE_URL')}/predict`,
        {
          modelId: model.id,
          features: inputFeatures,
          predictionType,
        }
      ).toPromise();

      const processingTime = Date.now() - startTime;
      
      return {
        predictions: response.data.predictions,
        confidence: response.data.confidence,
        processingTime,
        modelVersion: model.version,
      };

    } catch (error) {
      this.logger.error(`Prediction failed for model ${model.id}: ${error.message}`);
      throw error;
    }
  }

  private async storePrediction(
    modelId: string,
    userId: string | null,
    inputData: any,
    outputData: any,
    predictionType: string
  ): Promise<void> {
    try {
      const prediction = this.predictionRepository.create({
        modelId,
        userId,
        predictionType: predictionType as any,
        inputData: {
          features: inputData,
          context: {
            timestamp: new Date(),
          },
        },
        outputData,
        confidence: outputData.confidence || 0,
        processingTimeMs: outputData.processingTime || 0,
      });

      await this.predictionRepository.save(prediction);
    } catch (error) {
      this.logger.error(`Failed to store prediction: ${error.message}`);
    }
  }

  private async getPatronData(patronId: string): Promise<any> {
    // This would call other services to get patron data
    // For now, return mock data structure
    return {
      id: patronId,
      borrowingHistory: [],
      preferences: {},
      demographics: {},
      behaviorPatterns: {},
    };
  }

  private async getLibraryData(libraryId: string): Promise<any> {
    // This would call other services to get library data
    return {
      id: libraryId,
      collection: {},
      usage: {},
      demographics: {},
      budget: {},
    };
  }

  private async getItemData(itemId: string): Promise<any> {
    // This would call catalog service to get item data
    return {
      id: itemId,
      metadata: {},
      subjects: [],
      genres: [],
      features: {},
    };
  }

  private async prepareRecommendationFeatures(patronData: any, options: any): Promise<any> {
    // Feature engineering for recommendation model
    return {
      patron_features: patronData,
      context_features: options,
      timestamp: new Date(),
    };
  }

  private async prepareCollectionFeatures(libraryData: any, options: any): Promise<any> {
    // Feature engineering for collection development
    return {
      library_features: libraryData,
      collection_features: options,
      timestamp: new Date(),
    };
  }

  private async prepareContentFeatures(itemData: any): Promise<any> {
    // Feature engineering for content-based recommendations
    return {
      item_features: itemData,
      content_vectors: itemData.features,
      metadata_features: itemData.metadata,
    };
  }

  private async postProcessRecommendations(
    predictions: any,
    patronData: any,
    options: any
  ): Promise<any[]> {
    // Post-process ML predictions into recommendation format
    return predictions.predictions.map((pred: any, index: number) => ({
      itemId: pred.value,
      title: pred.title || 'Unknown Title',
      confidence: pred.confidence,
      rank: index + 1,
      reason: pred.explanation || 'Based on your reading history',
      metadata: pred.metadata || {},
    }));
  }

  private async processCollectionRecommendations(
    predictions: any,
    libraryData: any,
    options: any
  ): Promise<any[]> {
    // Process collection development predictions
    return predictions.predictions.map((pred: any) => ({
      recommendation: pred.value,
      priority: pred.confidence,
      estimatedDemand: pred.demand || 0,
      costBenefit: pred.costBenefit || 0,
      reasoning: pred.explanation || 'Based on usage patterns and trends',
    }));
  }

  private async processContentRecommendations(
    predictions: any,
    itemData: any,
    options: any
  ): Promise<any[]> {
    // Process content-based similarity predictions
    return predictions.predictions.map((pred: any) => ({
      itemId: pred.value,
      similarity: pred.confidence,
      commonFeatures: pred.features || [],
      reason: `Similar to "${itemData.title}"`,
    }));
  }

  private async getFallbackRecommendations(patronId: string, options: any): Promise<any[]> {
    // Simple fallback recommendations when ML models are unavailable
    this.logger.log(`Using fallback recommendations for patron ${patronId}`);
    
    // This would implement simple rule-based recommendations
    return [
      {
        itemId: 'fallback-1',
        title: 'Popular Recent Addition',
        confidence: 0.7,
        rank: 1,
        reason: 'Popular among library patrons',
        metadata: { source: 'fallback' },
      },
    ];
  }

  private async getContentSimilarityFallback(itemId: string, options: any): Promise<any[]> {
    // Simple content similarity fallback
    return [];
  }

  private async findSimilarPatrons(patronId: string, count: number): Promise<any[]> {
    // Find patrons with similar borrowing patterns
    return [];
  }

  private async getCandidateItemsFromSimilarPatrons(
    patronId: string,
    similarPatrons: any[],
    options: any
  ): Promise<any[]> {
    // Get items that similar patrons have borrowed/liked
    return [];
  }

  private async scoreCollaborativeRecommendations(
    patronId: string,
    candidateItems: any[],
    similarPatrons: any[],
    options: any
  ): Promise<any[]> {
    // Score items based on collaborative filtering
    return [];
  }

  private async getPatronRecentItems(patronId: string, count: number): Promise<any[]> {
    // Get patron's recently borrowed items
    return [];
  }

  private async combineRecommendations(
    recommendations: {
      personalized: any[];
      collaborative: any[];
      content: any[];
    },
    weights: {
      personalizedWeight: number;
      collaborativeWeight: number;
      contentWeight: number;
    }
  ): Promise<any[]> {
    // Combine recommendations from different approaches with weights
    const combined = new Map();
    
    // Add personalized recommendations
    recommendations.personalized.forEach(rec => {
      const score = rec.confidence * weights.personalizedWeight;
      if (combined.has(rec.itemId)) {
        combined.get(rec.itemId).score += score;
      } else {
        combined.set(rec.itemId, { ...rec, score, sources: ['personalized'] });
      }
    });
    
    // Add collaborative recommendations
    recommendations.collaborative.forEach(rec => {
      const score = rec.confidence * weights.collaborativeWeight;
      if (combined.has(rec.itemId)) {
        const existing = combined.get(rec.itemId);
        existing.score += score;
        existing.sources.push('collaborative');
      } else {
        combined.set(rec.itemId, { ...rec, score, sources: ['collaborative'] });
      }
    });
    
    // Add content-based recommendations
    recommendations.content.forEach(rec => {
      const score = rec.similarity * weights.contentWeight;
      if (combined.has(rec.itemId)) {
        const existing = combined.get(rec.itemId);
        existing.score += score;
        existing.sources.push('content');
      } else {
        combined.set(rec.itemId, { ...rec, score, sources: ['content'] });
      }
    });
    
    // Sort by combined score
    return Array.from(combined.values()).sort((a, b) => b.score - a.score);
  }

  private async applyDiversityBoost(recommendations: any[], patronId: string): Promise<any[]> {
    // Apply diversity to avoid too many similar recommendations
    const diversified = [];
    const usedCategories = new Set();
    
    for (const rec of recommendations) {
      const category = rec.metadata?.category || 'general';
      
      // Add item if we haven't seen this category or if we have room for more diversity
      if (!usedCategories.has(category) || diversified.length < recommendations.length * 0.7) {
        diversified.push(rec);
        usedCategories.add(category);
      }
    }
    
    return diversified;
  }

  private async getTrendingData(libraryId: string, timeWindow: string): Promise<any> {
    // Get trending data from circulation and usage statistics
    return {
      circulation: [],
      views: [],
      holds: [],
      timeWindow,
    };
  }

  private async processTrendingPredictions(predictions: any, options: any): Promise<any[]> {
    // Process trending predictions from ML model
    return predictions.predictions.map((pred: any) => ({
      itemId: pred.value,
      trendScore: pred.confidence,
      velocity: pred.velocity || 0,
      reason: 'Trending based on recent activity',
    }));
  }

  private async calculateSimpleTrending(trendingData: any, options: any): Promise<any[]> {
    // Simple trending calculation without ML
    return [];
  }

  // Feedback and Learning
  async recordRecommendationFeedback(
    predictionId: string,
    feedback: {
      rating: number;
      action: 'clicked' | 'borrowed' | 'ignored' | 'disliked';
      comments?: string;
    }
  ): Promise<void> {
    try {
      const prediction = await this.predictionRepository.findOne({
        where: { id: predictionId },
      });

      if (prediction) {
        prediction.feedbackReceived = true;
        prediction.feedbackScore = feedback.rating;
        prediction.feedbackComments = feedback.comments;

        await this.predictionRepository.save(prediction);

        // Update model performance metrics
        await this.updateModelPerformance(prediction.modelId, feedback);
      }
    } catch (error) {
      this.logger.error(`Failed to record feedback: ${error.message}`);
    }
  }

  private async updateModelPerformance(modelId: string, feedback: any): Promise<void> {
    // Update model performance metrics based on feedback
    // This would be used for model monitoring and retraining decisions
  }
}
