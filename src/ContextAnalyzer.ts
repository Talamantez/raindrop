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
    
        const models = snapshot.getFilesByPattern(/models/i);
        const views = snapshot.getFilesByPattern(/views/i);
        const controllers = snapshot.getFilesByPattern(/controllers/i);
        const hasModules = snapshot.getFilesByPattern(/modules/i).length > 0;
        const hasServices = snapshot.getFilesByPattern(/services/i).length > 0;
    
        // MVC scoring
        if (models.length && views.length && controllers.length) {
            patterns.mvc = 1.5;
        }
    
        // Modular scoring
        if (hasModules) { 
            patterns.modular += 1;
        }
        
        // Service detection - only count once
        if (hasServices) {
            patterns.modular += 0.5;
            patterns.microservices = 1; // Changed from += to = to ensure single count
        }
    
        // Remove incremental scoring for individual components
        if (models.length > 0) patterns.mvc += 0.25;
        if (views.length > 0) patterns.mvc += 0.25;
        if (controllers.length > 0) patterns.mvc += 0.25;
    
        // Determine primary style 
        let primaryStyle: keyof typeof patterns = 'modular';
        let maxScore = patterns.modular;
    
        Object.entries(patterns).forEach(([style, score]) => {
            if (score > maxScore) {
                primaryStyle = style as keyof typeof patterns;
                maxScore = score;
            }
        });
    
        const totalScore = Object.values(patterns).reduce((sum, score) => sum + score, 0);
        const confidence = totalScore > 0 ? maxScore / totalScore : 0;
    
        return {
            primaryStyle,
            confidence,
            patterns
        };
    }

    private async _buildDependencyGraph(snapshot: RepoSnapshot): Promise<DependencyGraph> {
        const graph: DependencyGraph = {
            nodes: new Map(),
            edges: new Map()
        };

        // Analyze import statements and dependencies
        for (const file of snapshot.getFiles()) {
            if (!['.js', '.ts', '.jsx', '.tsx'].some(ext => file.path.endsWith(ext))) {
                continue;
            }

            const imports = this._extractImports(file.content);
            graph.nodes.set(file.path, {
                path: file.path,
                type: this._determineNodeType(file.path),
                size: file.size
            });

            for (const imp of imports) {
                const edge = {
                    from: file.path,
                    to: this._resolveImportPath(file.path, imp),
                    type: 'import'
                };
                graph.edges.set(`${edge.from}-${edge.to}`, edge);
            }
        }

        return graph;
    }

    private _extractImports(content: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"];?/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            if (match[1] && !match[1].startsWith('vscode') && match[1] !== '..') {
                imports.push(match[1]);
            }
        }
    
        return imports;
    }

    private _resolveImportPath(sourcePath: string, importPath: string): string {
        if (!importPath || importPath === '..') {
            return ''; // Skip invalid imports
        }
        
        if (importPath.startsWith('.')) {
            const sourceDir = path.dirname(sourcePath);
            const resolved = path.join(sourceDir, importPath)
                .replace(/\\/g, '/')
                .replace(/\/{2,}/g, '/');
            return resolved;
        }
        return importPath;
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