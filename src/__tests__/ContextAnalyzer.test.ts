// src/__tests__/ContextAnalyzer.test.ts

import { jest } from '@jest/globals';
import { ContextAnalyzer } from '../ContextAnalyzer';
import { RepoSnapshot } from '../RepoSnapshot';
import { ContextReport } from '../types';

// Mock VSCode namespace
jest.mock('vscode', () => ({
    Disposable: jest.fn(),
    // Add other VSCode APIs as needed
}), { virtual: true });

describe('ContextAnalyzer', () => {
    let analyzer: ContextAnalyzer;
    let mockSnapshot: jest.Mocked<RepoSnapshot>;

    beforeEach(() => {
        // Create fresh analyzer instance
        analyzer = new ContextAnalyzer();

        // Setup mock snapshot
        mockSnapshot = {
            getFiles: jest.fn(),
            getFilesByPattern: jest.fn().mockReturnValue([]),
            dispose: jest.fn()
        } as any;
    });

    describe('analyzeContext', () => {
        it('should return a complete context report', async () => {
            // Setup mock files
            mockSnapshot.getFiles.mockReturnValue([
                {
                    path: 'src/models/User.ts',
                    content: 'export class User {}',
                    size: 100,
                    language: 'typescript'
                },
                {
                    path: 'src/controllers/UserController.ts',
                    content: 'import { User } from "../models/User"',
                    size: 200,
                    language: 'typescript'
                }
            ]);

            mockSnapshot.getFilesByPattern.mockImplementation((pattern: RegExp) => {
                return mockSnapshot.getFiles().filter((f: { path: string }) => pattern.test(f.path));
            });

            // Execute analysis
            const report: ContextReport = await analyzer.analyzeContext(mockSnapshot);

            // Verify report structure
            expect(report).toBeDefined();
            expect(report.timestamp).toBeInstanceOf(Date);
            expect(report.architecturalStyle).toBeDefined();
            expect(report.dependencyGraph).toBeDefined();
            expect(report.patterns).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });

        it('should detect MVC architectural style', async () => {
            // Setup mock files suggesting MVC pattern
            mockSnapshot.getFiles.mockReturnValue([
                { path: 'src/models/User.ts', content: '', size: 100, language: 'typescript' },
                { path: 'src/views/UserView.tsx', content: '', size: 200, language: 'typescript' },
                { path: 'src/controllers/UserController.ts', content: '', size: 300, language: 'typescript' }
            ]);

            mockSnapshot.getFilesByPattern.mockImplementation((pattern: RegExp) => {
                return mockSnapshot.getFiles().filter((f: { path: string }) => pattern.test(f.path));
            });

            const report = await analyzer.analyzeContext(mockSnapshot);

            expect(report.architecturalStyle.primaryStyle).toBe('mvc');
            expect(report.architecturalStyle.confidence).toBeGreaterThan(0);
        });

        test('should build dependency graph', async () => {
            mockSnapshot.getFiles.mockReturnValue([
                {
                    path: 'src/main.ts',
                    content: 'import { User } from "./models/User"',
                    size: 100,
                    language: 'typescript'
                }
            ]);
            
            mockSnapshot.getFilesByPattern.mockReturnValue([]); // Ensure array return
            
            const report = await analyzer.analyzeContext(mockSnapshot);
            expect(report.dependencyGraph.nodes.size).toBeGreaterThan(0);
        });

        it('should handle empty repositories', async () => {
            mockSnapshot.getFiles.mockReturnValue([]);

            const report = await analyzer.analyzeContext(mockSnapshot);

            expect(report).toBeDefined();
            expect(report.dependencyGraph.nodes.size).toBe(0);
            expect(report.dependencyGraph.edges.size).toBe(0);
        });
    });

    describe('dispose', () => {
        it('should clean up resources', () => {
            analyzer.dispose();
            // Add specific cleanup verification as needed
        });
    });
});