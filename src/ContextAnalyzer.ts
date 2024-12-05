// src/ContextAnalyzer.ts
import * as vscode from 'vscode';
import * as path from 'path';  // Add this - it was missing
import { RepoSnapshot } from './RepoSnapshot';
import { ContextReport, DependencyGraph, ArchitecturalStyle } from './types';
export class ContextAnalyzer implements vscode.Disposable {
    private readonly _disposables: vscode.Disposable[] = [];

    constructor() { }

    public async analyzeContext(snapshot: RepoSnapshot): Promise<ContextReport> {
        const files = snapshot.getFiles();

        // Build up analysis in parallel
        const [
            architecturalStyle,
            dependencyGraph,
            codingPatterns,
            errorHandling,
            testingApproach
        ] = await Promise.all([
            this._detectArchitecturalStyle(snapshot),
            this._buildDependencyGraph(snapshot),
            this._analyzeCodingPatterns(snapshot),
            this._analyzeErrorHandling(snapshot),
            this._analyzeTestingApproach(snapshot)
        ]);

        // Security and performance patterns
        const securityPatterns = await this._analyzeSecurityPatterns(snapshot);
        const performancePatterns = await this._analyzePerformancePatterns(snapshot);

        return {
            timestamp: new Date(),
            architecturalStyle,
            dependencyGraph,
            patterns: {
                coding: codingPatterns,
                security: securityPatterns,
                performance: performancePatterns,
                testing: testingApproach,
                errorHandling
            },
            recommendations: this._generateRecommendations({
                architecturalStyle,
                dependencyGraph,
                codingPatterns,
                securityPatterns,
                performancePatterns
            })
        };
    }

    private async _detectArchitecturalStyle(snapshot: RepoSnapshot): Promise<ArchitecturalStyle> {
        const patterns = {
            mvc: 0,
            layered: 0,
            microservices: 0,
            eventDriven: 0,
            modular: 0
        };
    
        const files = snapshot.getFiles().map(f => 
            f.path.replace(/^\/+/, '').replace(/\\/g, '/').toLowerCase()
        );
    
        // Module detection - look for both root modules and nested modules
        const hasModules = files.some(path => /^modules?\//.test(path));
        if (hasModules) {
            patterns.modular = 1;
        }
    
        // Enhanced MVC detection - look for patterns in both root and nested paths
        const hasMvcComponents = files.some(path => 
            /controllers?\//i.test(path) || 
            /views?\//i.test(path) || 
            /models?\//i.test(path)
        );
    
        // If we find any MVC component inside a module, we mark both patterns
        const hasNestedMvc = files.some(path => 
            path.includes('/modules/') && 
            (/controllers?\/|views?\/|models?\//i).test(path)
        );
    
        if (hasMvcComponents || hasNestedMvc) {
            patterns.mvc = 1;
        }
    
        // Services detection
        const hasServices = files.some(path => /services?\//i.test(path) || path.endsWith('.service.ts'));
        if (hasServices) {
            patterns.microservices = 1;
        }
    
        // Determine primary style
        let primaryStyle: keyof typeof patterns;
        if (hasModules && !hasMvcComponents && !hasNestedMvc) {
            primaryStyle = 'modular';
        } else if (patterns.mvc) {
            primaryStyle = 'mvc';
        } else {
            primaryStyle = Object.entries(patterns)
                .reduce((a, b) => b[1] > a[1] ? b : a)[0] as keyof typeof patterns;
        }
    
        return {
            primaryStyle,
            confidence: 1.0,
            patterns
        };
    }
    
    private _buildDependencyGraph(snapshot: RepoSnapshot): DependencyGraph {
        const graph: DependencyGraph = {
            nodes: new Map(),
            edges: new Map()
        };
    
        const files = snapshot.getFiles();
        files.forEach(file => {
            // Add node
            graph.nodes.set(file.path, {
                path: file.path,
                type: this._determineNodeType(file.path),
                size: file.size
            });
    
            // Process imports
            const imports = this._extractImports(file.content);
            imports.forEach(importPath => {
                const resolved = this._resolveImportPath(file.path, importPath);
                if (resolved) {
                    const edge = {
                        from: file.path,
                        to: resolved,
                        type: 'import'
                    };
                    graph.edges.set(`${file.path}:${resolved}`, edge);
                }
            });
        });
    
        return graph;
    }
    
    private _extractImports(content: string): string[] {
        const imports = new Set<string>();
        // More strict regex that requires proper import syntax
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            // Stricter validation of import paths
            if (this._isValidImportPath(importPath)) {
                imports.add(importPath);
            }
        }
    
        return Array.from(imports);
    }
    
    private _isValidImportPath(importPath: string): boolean {
        return Boolean(
            importPath &&
            importPath !== '..' &&
            importPath !== '.' &&
            !importPath.startsWith('vscode') &&
            /^[@\w\-./]+$/.test(importPath) // Only allow valid path characters
        );
    }
    
    private _resolveImportPath(sourcePath: string, importPath: string): string | null {
        if (!this._isValidImportPath(importPath)) {
            return null;
        }
    
        try {
            if (importPath.startsWith('.')) {
                const sourceDir = path.dirname(sourcePath);
                return path.join(sourceDir, importPath)
                    .replace(/\\/g, '/')
                    .replace(/\.(js|ts|jsx|tsx)$/, '')
                    .replace(/\/index$/, '')
                    .replace(/\/+/g, '/');
            }
            return importPath;
        } catch {
            return null;
        }
    }

    private _determineNodeType(filePath: string): string {
        if (filePath.includes('test')) return 'test';
        if (filePath.includes('component')) return 'component';
        if (filePath.includes('util')) return 'utility';
        return 'module';
    }

    private async _analyzeCodingPatterns(snapshot: RepoSnapshot): Promise<any> {
        // Implement coding pattern analysis
        return {};
    }

    private async _analyzeErrorHandling(snapshot: RepoSnapshot): Promise<any> {
        // Implement error handling analysis
        return {};
    }

    private async _analyzeTestingApproach(snapshot: RepoSnapshot): Promise<any> {
        // Implement testing approach analysis
        return {};
    }

    private async _analyzeSecurityPatterns(snapshot: RepoSnapshot): Promise<any> {
        // Implement security pattern analysis
        return {};
    }

    private async _analyzePerformancePatterns(snapshot: RepoSnapshot): Promise<any> {
        // Implement performance pattern analysis
        return {};
    }

    private _generateRecommendations(analysis: any): string[] {
        // Generate recommendations based on analysis
        return [];
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}