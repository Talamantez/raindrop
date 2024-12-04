// src/types/index.ts
export interface FileInfo {
    path: string;
    content: string;
    size: number;
    language: string;
    lastModified?: Date;
}

export interface FilePattern {
    name: string;
    regex: RegExp;
    matches: FileInfo[];
}

export interface AnalysisResult {
    timestamp: Date;
    snapshot: any;  // RepoSnapshot
    context: ContextReport;
    specifications: SpecificationInfo[];
    patterns: FilePattern[];
}

export interface SpecificationInfo {
    path: string;
    content: string;
    language: string;
    type: string;
}

export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    edges: Map<string, DependencyEdge>;
}

export interface DependencyNode {
    path: string;
    type: string;
    size: number;
}

export interface DependencyEdge {
    from: string;
    to: string;
    type: string;
}

export interface ArchitecturalStyle {
    primaryStyle: string;
    confidence: number;
    patterns: Record<string, number>;
}

export interface ContextReport {
    timestamp: Date;
    architecturalStyle: ArchitecturalStyle;
    dependencyGraph: DependencyGraph;
    patterns: {
        coding: any;
        security: any;
        performance: any;
        testing: any;
        errorHandling: any;
    };
    recommendations: string[];
}

export interface SnapshotStatistics {
    totalFiles: number;
    totalSize: number;
    languageCounts: Record<string, number>;
    averageFileSize: number;
    largestFiles: FileInfo[];
    patternMatches: Record<string, number>;
}