// Database configuration and connection types

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
  logging?: boolean;
  synchronize?: boolean;
  migrationsRun?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

export interface ElasticsearchConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  ssl?: {
    rejectUnauthorized: boolean;
  };
  requestTimeout?: number;
  maxRetries?: number;
}

// Migration types
export interface Migration {
  id: string;
  name: string;
  timestamp: number;
  up: string;
  down: string;
}

export interface MigrationStatus {
  id: string;
  name: string;
  executedAt: Date;
  success: boolean;
  error?: string;
}
