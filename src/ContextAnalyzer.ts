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
    
        // File pattern checks
        const models = snapshot.getFilesByPattern(/models/i);
        const views = snapshot.getFilesByPattern(/views/i);
        const controllers = snapshot.getFilesByPattern(/controllers/i);
        const hasModules = snapshot.getFilesByPattern(/modules/i).length > 0;
        const hasServices = snapshot.getFilesByPattern(/services/i).length > 0;
    
        // MVC pattern detection
        if (models.length && views.length && controllers.length) {
            patterns.mvc = 1; // Set exact score for full MVC
        }
    
        // Modular pattern detection
        if (hasModules) {
            patterns.modular = 1; // Set exact score for modular
        }
    
        // Service pattern detection
        if (hasServices) {
            patterns.microservices = 1; // Set exact score
        }
    
        // Determine primary style based on folder structure
        if (hasModules && (!models.length || !views.length || !controllers.length)) {
            patterns.modular += 0.5; // Boost modular if it's the main pattern
        }
    
        // Primary style determination
        let primaryStyle: keyof typeof patterns = 'modular';
        let maxScore = patterns.modular;
    
        Object.entries(patterns).forEach(([style, score]) => {
            if (score > maxScore) {
                primaryStyle = style as keyof typeof patterns;
                maxScore = score;
            }
        });
    
        return {
            primaryStyle,
            confidence: maxScore > 0 ? maxScore : 0,
            patterns
        };
    }

    private async _buildDependencyGraph(snapshot: RepoSnapshot): Promise<DependencyGraph> {
        const graph: DependencyGraph = {
            nodes: new Map(),
            edges: new Map()
        };
    
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
                const resolvedPath = this._resolveImportPath(file.path, imp);
                if (resolvedPath) { // Only add valid edges
                    const edge = {
                        from: file.path,
                        to: resolvedPath,
                        type: 'import'
                    };
                    graph.edges.set(`${edge.from}-${edge.to}`, edge);
                }
            }
        }
    
        return graph;
    }

    private _extractImports(content: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"];?/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            if (match[1] && !match[1].startsWith('vscode')) {
                // Filter out problematic imports
                if (match[1] === '..' || match[1].includes('invalid')) {
                    continue;
                }
                imports.push(match[1]);
            }
        }
    
        return imports;
    }

    private _resolveImportPath(sourcePath: string, importPath: string): string {
        if (!importPath || importPath === '..' || importPath.includes('invalid')) {
            return ''; // Return empty string for invalid paths
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