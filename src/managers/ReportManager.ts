// src/managers/ReportManager.ts
import * as vscode from 'vscode';
import { AnalysisResult } from '../types';

export class ReportManager implements vscode.Disposable {
    private readonly _disposables: vscode.Disposable[] = [];
    private _currentPanel: vscode.WebviewPanel | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public async showAnalysisReport(analysis: AnalysisResult): Promise<void> {
        // Reuse or create panel
        if (this._currentPanel) {
            this._currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            this._currentPanel = vscode.window.createWebviewPanel(
                'repoScaffoldReport',
                'Repository Analysis Report',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Clean up panel when disposed
            this._currentPanel.onDidDispose(() => {
                this._currentPanel = undefined;
            }, null, this._disposables);
        }

        // Update content
        this._currentPanel.webview.html = this._generateReportHtml(analysis);
    }

    private _generateReportHtml(analysis: AnalysisResult): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Repository Analysis Report</title>
                <style>
                    body { font-family: var(--vscode-font-family); }
                    .section { margin: 20px 0; }
                    .pattern-match { margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>Repository Analysis Report</h1>
                <div class="section">
                    <h2>Architectural Style</h2>
                    <p>Primary Style: ${analysis.context.architecturalStyle.primaryStyle}</p>
                    <p>Confidence: ${(analysis.context.architecturalStyle.confidence * 100).toFixed(1)}%</p>
                </div>
                <div class="section">
                    <h2>Pattern Matches</h2>
                    ${this._renderPatternMatches(analysis)}
                </div>
                <div class="section">
                    <h2>Recommendations</h2>
                    <ul>
                        ${analysis.context.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            </body>
            </html>
        `;
    }

    private _renderPatternMatches(analysis: AnalysisResult): string {
        return Object.entries(analysis.context.patterns)
            .map(([category, patterns]) => `
                <div class="pattern-match">
                    <h3>${category}</h3>
                    <ul>
                        ${Object.entries(patterns)
                            .map(([name, count]) => `<li>${name}: ${count}</li>`)
                            .join('')}
                    </ul>
                </div>
            `)
            .join('');
    }

    public async generateReport(): Promise<void> {
        // Additional report generation logic can go here
    }

    public dispose(): void {
        if (this._currentPanel) {
            this._currentPanel.dispose();
        }
        this._disposables.forEach(d => d.dispose());
    }
}