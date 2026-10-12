import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('dashboards')
@Index(['dashboardType', 'isActive'])
@Index(['createdBy'])
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['executive', 'operational', 'financial', 'circulation', 'collection', 'patron', 'custom'],
  })
  dashboardType: 'executive' | 'operational' | 'financial' | 'circulation' | 'collection' | 'patron' | 'custom';

  @Column({ type: 'json' })
  layout: {
    rows: Array<{
      id: string;
      height: number;
      columns: Array<{
        id: string;
        width: number; // 1-12 grid system
        widgets: Array<{
          id: string;
          type: 'metric' | 'chart' | 'table' | 'gauge' | 'progress' | 'text';
          title: string;
          config: any;
          dataSource: {
            type: 'metric' | 'query' | 'service';
            source: string;
            parameters?: any;
          };
          refreshInterval?: number; // seconds
          position: {
            x: number;
            y: number;
            width: number;
            height: number;
          };
        }>;
      }>;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  filters: {
    dateRange?: {
      type: 'relative' | 'absolute';
      value: string; // e.g., 'last_30_days' or '2024-01-01,2024-12-31'
    };
    library?: string;
    department?: string;
    materialType?: string;
    patronType?: string;
    [key: string]: any;
  };

  @Column({ type: 'json', nullable: true })
  permissions: {
    viewers: Array<{
      userId?: string;
      role?: string;
      department?: string;
    }>;
    editors: Array<{
      userId?: string;
      role?: string;
      department?: string;
    }>;
    isPublic?: boolean;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  autoRefresh: boolean;

  @Column({ type: 'int', default: 300 })
  refreshInterval: number; // seconds

  @Column({ type: 'timestamp', nullable: true })
  lastRefreshed: Date;

  @Column({ type: 'json', nullable: true })
  theme: {
    colorScheme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    chartColors: string[];
  };

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastViewedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    tags?: string[];
    category?: string;
    version?: string;
    lastModifiedBy?: string;
    changeLog?: Array<{
      timestamp: Date;
      userId: string;
      action: string;
      description: string;
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Virtual Properties
  get widgetCount(): number {
    let count = 0;
    this.layout.rows.forEach(row => {
      row.columns.forEach(column => {
        count += column.widgets.length;
      });
    });
    return count;
  }

  get rowCount(): number {
    return this.layout.rows.length;
  }

  get columnCount(): number {
    return this.layout.rows.reduce((total, row) => total + row.columns.length, 0);
  }

  get isStale(): boolean {
    if (!this.lastRefreshed) return true;
    const staleDuration = this.refreshInterval * 2 * 1000; // 2x refresh interval in ms
    return (new Date().getTime() - this.lastRefreshed.getTime()) > staleDuration;
  }

  get needsRefresh(): boolean {
    if (!this.autoRefresh) return false;
    if (!this.lastRefreshed) return true;
    const refreshDuration = this.refreshInterval * 1000; // refresh interval in ms
    return (new Date().getTime() - this.lastRefreshed.getTime()) > refreshDuration;
  }

  get dashboardTypeDisplayName(): string {
    const typeMap = {
      executive: 'Executive Dashboard',
      operational: 'Operational Dashboard',
      financial: 'Financial Dashboard',
      circulation: 'Circulation Dashboard',
      collection: 'Collection Dashboard',
      patron: 'Patron Dashboard',
      custom: 'Custom Dashboard',
    };
    return typeMap[this.dashboardType] || this.dashboardType;
  }

  get refreshIntervalFormatted(): string {
    const seconds = this.refreshInterval;
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes}m`;
    
    const hours = minutes / 60;
    return `${hours}h`;
  }

  get lastRefreshedFormatted(): string {
    if (!this.lastRefreshed) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - this.lastRefreshed.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  get ageInDays(): number {
    return Math.floor((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  get viewsPerDay(): number {
    return this.ageInDays > 0 ? this.viewCount / this.ageInDays : this.viewCount;
  }

  get tags(): string[] {
    return this.metadata?.tags || [];
  }

  get category(): string {
    return this.metadata?.category || 'Uncategorized';
  }

  get version(): string {
    return this.metadata?.version || '1.0.0';
  }

  get changeLogCount(): number {
    return this.metadata?.changeLog?.length || 0;
  }

  get lastModifiedBy(): string {
    return this.metadata?.lastModifiedBy || 'Unknown';
  }

  get hasFilters(): boolean {
    return this.filters && Object.keys(this.filters).length > 0;
  }

  get filterCount(): number {
    return this.filters ? Object.keys(this.filters).length : 0;
  }

  get isPublic(): boolean {
    return this.permissions?.isPublic || false;
  }

  get viewerCount(): number {
    return this.permissions?.viewers?.length || 0;
  }

  get editorCount(): number {
    return this.permissions?.editors?.length || 0;
  }

  get themeDisplayName(): string {
    const colorScheme = this.theme?.colorScheme || 'light';
    const schemeMap = {
      light: 'Light Theme',
      dark: 'Dark Theme',
      auto: 'Auto Theme',
    };
    return schemeMap[colorScheme] || colorScheme;
  }

  getWidgetById(widgetId: string): any {
    for (const row of this.layout.rows) {
      for (const column of row.columns) {
        const widget = column.widgets.find(w => w.id === widgetId);
        if (widget) return widget;
      }
    }
    return null;
  }

  getWidgetsByType(type: string): any[] {
    const widgets = [];
    for (const row of this.layout.rows) {
      for (const column of row.columns) {
        widgets.push(...column.widgets.filter(w => w.type === type));
      }
    }
    return widgets;
  }

  canUserView(userId: string, userRole?: string, userDepartment?: string): boolean {
    if (this.isPublic) return true;
    if (this.createdBy === userId) return true;
    
    if (!this.permissions?.viewers) return false;
    
    return this.permissions.viewers.some(viewer => 
      viewer.userId === userId ||
      viewer.role === userRole ||
      viewer.department === userDepartment
    );
  }

  canUserEdit(userId: string, userRole?: string, userDepartment?: string): boolean {
    if (this.createdBy === userId) return true;
    
    if (!this.permissions?.editors) return false;
    
    return this.permissions.editors.some(editor => 
      editor.userId === userId ||
      editor.role === userRole ||
      editor.department === userDepartment
    );
  }

  addChangeLogEntry(userId: string, action: string, description: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.changeLog) this.metadata.changeLog = [];
    
    this.metadata.changeLog.push({
      timestamp: new Date(),
      userId,
      action,
      description,
    });
    
    // Keep only last 50 entries
    if (this.metadata.changeLog.length > 50) {
      this.metadata.changeLog = this.metadata.changeLog.slice(-50);
    }
  }
}
