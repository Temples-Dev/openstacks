// Multi-Tenant Architecture Types for OpenStacks Phase 2

export interface LibrarySystemConfig {
  id: string;
  name: string;
  type: 'single' | 'multi_branch' | 'consortium';
  timezone: string;
  locale: string;
  currency: string;
  fiscalYearStart: string; // MM-DD format
}

export interface LibraryConfig {
  id: string;
  code: string;
  name: string;
  type: 'main' | 'branch' | 'consortium_member';
  systemId: string;
  parentLibraryId?: string;
  isActive: boolean;
}

export interface BranchConfig {
  id: string;
  libraryId: string;
  name: string;
  code: string;
  address: AddressInfo;
  contactInfo: ContactInfo;
  operatingHours: OperatingHours[];
  services: ServiceConfig[];
  isActive: boolean;
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isClosed: boolean;
  specialHours?: {
    date: string; // YYYY-MM-DD
    openTime?: string;
    closeTime?: string;
    isClosed: boolean;
    reason?: string;
  }[];
}

export interface ServiceConfig {
  serviceType: 'circulation' | 'reference' | 'computer_access' | 'printing' | 'meeting_rooms' | 'study_rooms' | 'children_programs' | 'adult_programs';
  isAvailable: boolean;
  description?: string;
  restrictions?: string[];
  additionalInfo?: Record<string, any>;
}

// Circulation Policies for Multi-Tenant
export interface CirculationPolicyConfig {
  id: string;
  name: string;
  libraryId: string;
  patronTypes: string[];
  materialTypes: string[];
  loanPeriodDays: number;
  renewalLimit: number;
  renewalPeriodDays: number;
  fineRate: number; // per day
  maxFineAmount: number;
  gracePeriodDays: number;
  holdExpirationDays: number;
  isActive: boolean;
  restrictions?: {
    maxItemsOut: number;
    maxHolds: number;
    maxRenewals: number;
    requiresApproval: boolean;
  };
}

// Resource Sharing Policies
export interface ResourceSharingPolicy {
  id: string;
  systemId: string;
  name: string;
  allowInterbranchLoans: boolean;
  allowInterbranchHolds: boolean;
  allowInterbranchReturns: boolean;
  transitTime: number; // days
  shippingCost: number;
  reciprocalAgreements: string[]; // library system IDs
  restrictions?: {
    materialTypes: string[];
    patronTypes: string[];
    maxTransitDistance: number; // miles
  };
}

// Tenant Context for Request Processing
export interface TenantContext {
  systemId: string;
  libraryId: string;
  branchId?: string;
  userId: string;
  userRoles: string[];
  permissions: string[];
  preferences: {
    timezone: string;
    locale: string;
    currency: string;
  };
}

// Multi-Tenant Database Configuration
export interface TenantDatabaseConfig {
  tenantId: string;
  databaseName: string;
  connectionString: string;
  schemaName?: string;
  isShared: boolean;
  isolationLevel: 'database' | 'schema' | 'row_level';
}

// Cross-Tenant Data Sharing
export interface CrossTenantDataAccess {
  sourceSystemId: string;
  targetSystemId: string;
  dataType: 'patron' | 'item' | 'bibliographic' | 'circulation' | 'financial';
  accessLevel: 'read' | 'write' | 'full';
  conditions?: {
    patronTypes?: string[];
    materialTypes?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  isActive: boolean;
}

// System Integration Configuration
export interface SystemIntegrationConfig {
  id: string;
  systemId: string;
  integrationType: 'sip2' | 'ncip' | 'rest_api' | 'soap' | 'file_transfer';
  endpoint: string;
  authentication: {
    type: 'basic' | 'oauth' | 'api_key' | 'certificate';
    credentials: Record<string, any>;
  };
  dataMapping: FieldMapping[];
  syncSchedule?: {
    frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    time?: string; // HH:MM for scheduled syncs
  };
  isActive: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: {
    type: 'direct' | 'lookup' | 'calculation' | 'concatenation';
    parameters?: Record<string, any>;
  };
  isRequired: boolean;
}

// Consortium Management
export interface ConsortiumConfig {
  id: string;
  name: string;
  description: string;
  memberSystems: string[]; // library system IDs
  sharedServices: {
    catalog: boolean;
    circulation: boolean;
    acquisitions: boolean;
    ill: boolean;
    analytics: boolean;
  };
  governanceModel: {
    votingRights: Record<string, number>; // systemId -> voting weight
    decisionThreshold: number; // percentage required for decisions
    boardMembers: string[]; // user IDs
  };
  financialModel: {
    costSharingFormula: 'equal' | 'usage_based' | 'size_based' | 'custom';
    billingFrequency: 'monthly' | 'quarterly' | 'annually';
    sharedCosts: string[]; // cost categories
  };
}

// Multi-Tenant Metrics and Analytics
export interface TenantMetrics {
  systemId: string;
  libraryId?: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    circulation: {
      totalCheckouts: number;
      totalCheckins: number;
      totalRenewals: number;
      totalHolds: number;
      overdueItems: number;
    };
    collection: {
      totalItems: number;
      newAcquisitions: number;
      withdrawnItems: number;
      utilizationRate: number;
    };
    patrons: {
      totalPatrons: number;
      activePatrons: number;
      newRegistrations: number;
      patronSatisfaction: number;
    };
    financial: {
      totalSpending: number;
      budgetUtilization: number;
      finesCollected: number;
      costPerCirculation: number;
    };
    digital: {
      digitalCheckouts: number;
      databaseUsage: number;
      websiteVisits: number;
      mobileAppUsage: number;
    };
  };
}

// Event Types for Multi-Tenant Operations
export interface TenantEvent {
  id: string;
  eventType: 'system_created' | 'library_added' | 'branch_opened' | 'policy_updated' | 'integration_configured' | 'consortium_joined';
  systemId: string;
  libraryId?: string;
  branchId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    correlationId?: string;
  };
}

// Multi-Tenant Security and Permissions
export interface TenantPermission {
  id: string;
  name: string;
  description: string;
  scope: 'system' | 'library' | 'branch' | 'global';
  resource: string;
  actions: string[];
  conditions?: {
    timeRestrictions?: {
      allowedHours: string[];
      allowedDays: number[];
    };
    locationRestrictions?: {
      allowedBranches: string[];
      allowedIPs: string[];
    };
    dataRestrictions?: {
      ownDataOnly: boolean;
      departmentDataOnly: boolean;
    };
  };
}

export interface TenantRole {
  id: string;
  name: string;
  description: string;
  systemId: string;
  libraryId?: string;
  permissions: string[]; // permission IDs
  isSystemRole: boolean;
  isInheritable: boolean;
  parentRoleId?: string;
}

// Multi-Tenant Configuration Management
export interface TenantConfiguration {
  systemId: string;
  libraryId?: string;
  branchId?: string;
  configType: 'circulation' | 'catalog' | 'acquisitions' | 'discovery' | 'reporting' | 'integration';
  configuration: Record<string, any>;
  version: string;
  isActive: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  createdBy: string;
  approvedBy?: string;
}

// Data Export and Import for Multi-Tenant
export interface TenantDataExport {
  id: string;
  systemId: string;
  libraryId?: string;
  exportType: 'full' | 'incremental' | 'selective';
  dataTypes: string[];
  format: 'json' | 'xml' | 'csv' | 'marc';
  filters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  createdAt: Date;
  completedAt?: Date;
  requestedBy: string;
}

export interface TenantDataImport {
  id: string;
  systemId: string;
  libraryId?: string;
  importType: 'full' | 'incremental' | 'merge';
  dataType: string;
  sourceFormat: 'json' | 'xml' | 'csv' | 'marc';
  filePath: string;
  mappingProfile?: string;
  validationRules?: string[];
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors?: Array<{
    recordId: string;
    error: string;
    severity: 'warning' | 'error';
  }>;
  createdAt: Date;
  completedAt?: Date;
  requestedBy: string;
}
