// src/RepoSnapshot.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { FileInfo, SnapshotStatistics, FilePattern } from './types';

export class RepoSnapshot implements vscode.Disposable {
    private _files: Map<string, FileInfo> = new Map();
    private _patterns: Map<string, FilePattern> = new Map();
    private readonly _disposables: vscode.Disposable[] = [];
    
    constructor(
        public readonly timestamp: Date,
        public readonly rootPath: string
    ) {}

    public async capture(): Promise<void> {
        // Exclude common binary and dependency files
        const excludePattern = '**/{'
            + 'node_modules,'
            + '.git,'
            + 'dist,'
            + 'build,'
            + '*.exe,'
            + '*.dll,'
            + '*.so,'
            + '*.dylib,'
            + '*.png,'
            + '*.jpg,'
            + '*.jpeg'
            + '}/**';

        const files = await vscode.workspace.findFiles('**/*', excludePattern);
        
        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const relativePath = path.relative(this.rootPath, file.fsPath);
                const stats = await vscode.workspace.fs.stat(file);

                this._files.set(relativePath, {
                    path: relativePath,
                    content: document.getText(),
                    size: document.getText().length,
                    language: document.languageId,
                    lastModified: new Date(stats.mtime)
                });
            } catch (error) {
                console.warn(`Failed to capture file ${file.fsPath}:`, error);
            }
        }

        // Initial pattern detection
        await this._detectPatterns();
    }

    private async _detectPatterns(): Promise<void> {
        // Look for common file organization patterns
        this._patterns.set('src', {
            name: 'Source Directory',
            regex: /^src\//,
            matches: this.getFilesByPattern(/^src\//)
        });

        this._patterns.set('test', {
            name: 'Test Files',
            regex: /\.(test|spec)\.[jt]sx?$/,
            matches: this.getFilesByPattern(/\.(test|spec)\.[jt]sx?$/)
        });

        this._patterns.set('docs', {
            name: 'Documentation',
            regex: /^docs\/|\.md$/,
            matches: this.getFilesByPattern(/^docs\/|\.md$/)
        });
    }

    public getFiles(): FileInfo[] {
        return Array.from(this._files.values());
    }

    public getFilesByPattern(pattern: RegExp): FileInfo[] {
        return this.getFiles().filter(f => pattern.test(f.path));
    }

    public getFilesByLanguage(language: string): FileInfo[] {
        return this.getFiles().filter(f => f.language === language);
    }

    public getPatterns(): FilePattern[] {
        return Array.from(this._patterns.values());
    }

    public getStatistics(): SnapshotStatistics {
        const stats: SnapshotStatistics = {
            totalFiles: this._files.size,
            totalSize: 0,
            languageCounts: {},
            averageFileSize: 0,
            largestFiles: [],
            patternMatches: {}
        };

        // Aggregate basic stats
        for (const file of this._files.values()) {
            stats.totalSize += file.size;
            stats.languageCounts[file.language] = (stats.languageCounts[file.language] || 0) + 1;
        }

        // Calculate averages
        stats.averageFileSize = stats.totalSize / stats.totalFiles;

        // Find largest files
        stats.largestFiles = this.getFiles()
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);

        // Pattern statistics
        for (const pattern of this._patterns.values()) {
            stats.patternMatches[pattern.name] = pattern.matches.length;
        }

        return stats;
    }

    public toJSON(): string {
        return JSON.stringify({
            timestamp: this.timestamp,
            rootPath: this.rootPath,
            files: Array.from(this._files.entries()),
            patterns: Array.from(this._patterns.entries())
        }, null, 2);
    }

    public static fromJSON(json: string): RepoSnapshot {
        const data = JSON.parse(json);
        const snapshot = new RepoSnapshot(new Date(data.timestamp), data.rootPath);
        
        // Restore files
        data.files.forEach(([key, value]: [string, FileInfo]) => {
            snapshot._files.set(key, {
                ...value,
                lastModified: value.lastModified ? new Date(value.lastModified) : new Date()
            });
        });

        // Restore patterns
        data.patterns.forEach(([key, value]: [string, FilePattern]) => {
            snapshot._patterns.set(key, value);
        });

        return snapshot;
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._files.clear();
        this._patterns.clear();
    }
}