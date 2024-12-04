// src/SpecAnalyzer.ts
import * as vscode from 'vscode';
import { RepoSnapshot } from './RepoSnapshot';
import { ContextAnalyzer } from './ContextAnalyzer';
import { FilePattern, AnalysisResult, SpecificationInfo } from './types';

export class SpecAnalyzer implements vscode.Disposable {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _contextAnalyzer: ContextAnalyzer;
    private readonly _statusBar: vscode.StatusBarItem;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._contextAnalyzer = new ContextAnalyzer();
        this._statusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left
        );
        this._disposables = [this._contextAnalyzer, this._statusBar];
        // Initialize _disposables before using it
    }

    public async analyzeRepo(): Promise<AnalysisResult> {
        try {
            this._statusBar.text = "$(sync~spin) Analyzing repository...";
            this._statusBar.show();

            // Take repository snapshot
            const snapshot = new RepoSnapshot(
                new Date(),
                this._getWorkspaceRoot()
            );
            await snapshot.capture();

            // Analyze repository context
            const contextReport = await this._contextAnalyzer.analyzeContext(snapshot);

            // Find and analyze specifications
            const specifications = await this._findSpecifications(snapshot);

            // Generate patterns report
            const patterns = await this._analyzePatterns(snapshot, contextReport);

            return {
                timestamp: new Date(),
                snapshot: snapshot,
                context: contextReport,
                specifications: specifications,
                patterns: patterns
            };

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Analysis failed: ${message}`);
            throw error;
        } finally {
            this._statusBar.hide();
        }
    }

    private _getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    private async _findSpecifications(snapshot: RepoSnapshot): Promise<SpecificationInfo[]> {
        const specs: SpecificationInfo[] = [];
        
        // Look for common specification patterns
        const files = snapshot.getFiles();
        for (const file of files) {
            // Look for spec-like files
            if (this._isSpecificationFile(file)) {
                specs.push({
                    path: file.path,
                    content: file.content,
                    language: file.language,
                    type: this._determineSpecType(file)
                });
            }
        }

        return specs;
    }

    private _isSpecificationFile(file: any): boolean {
        // Check file patterns that typically contain specifications
        const specPatterns = [
            /\.spec\./i,
            /\.test\./i,
            /spec[ification]?s?/i,
            /requirements?/i,
            /contracts?/i
        ];

        return specPatterns.some(pattern => pattern.test(file.path));
    }

    private _determineSpecType(file: any): string {
        // Simple heuristic - can be expanded
        if (file.path.includes('test')) return 'test';
        if (file.path.includes('contract')) return 'contract';
        if (file.path.includes('spec')) return 'specification';
        return 'unknown';
    }

    private async _analyzePatterns(
        snapshot: RepoSnapshot,
        context: any
    ): Promise<FilePattern[]> {
        // Implement pattern analysis
        return [];
    }

    public dispose(): void {
        if (this._disposables) {
            this._disposables.forEach(d => {
                if (d && typeof d.dispose === 'function') {
                    try {
                        d.dispose();
                    } catch (error) {
                        console.warn('Error disposing:', error);
                    }
                }
            });
        }
    }
}