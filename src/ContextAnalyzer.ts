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

        // Look for MVC pattern
        if (snapshot.getFilesByPattern(/\/(models|views|controllers)\//i).length > 0) {
            patterns.mvc++;
        }

        // Look for layered architecture
        if (snapshot.getFilesByPattern(/\/(presentation|business|data|domain)\//i).length > 0) {
            patterns.layered++;
        }

        // Look for microservices
        if (snapshot.getFilesByPattern(/\/services\/|docker-compose\.ya?ml/i).length > 0) {
            patterns.microservices++;
        }

        // Look for event-driven patterns
        if (snapshot.getFilesByPattern(/\/(events|handlers|subscribers|listeners)\//i).length > 0) {
            patterns.eventDriven++;
        }

        // Look for modular patterns
        if (snapshot.getFilesByPattern(/\/modules\/|\/packages\//i).length > 0) {
            patterns.modular++;
        }

        // Return the most prevalent style
        const dominantStyle = Object.entries(patterns)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0] as keyof typeof patterns;

        return {
            primaryStyle: dominantStyle,
            confidence: patterns[dominantStyle] / Object.values(patterns).reduce((a, b) => a + b, 0),
            patterns: patterns
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
        const importRegex = /import\s+(?:.+\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    private _resolveImportPath(sourcePath: string, importPath: string): string {
        // Basic import resolution - could be enhanced
        if (importPath.startsWith('.')) {
            return path.resolve(path.dirname(sourcePath), importPath);
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