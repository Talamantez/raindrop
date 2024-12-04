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

        test('detects file organization patterns', async () => {
            const testFiles = [
                {
                    path: '/modules/auth.ts',
                    content: 'code',
                    size: 100,
                    language: 'typescript',
                    lastModified: new Date()
                },
                {
                    path: '/services/api.service.ts',
                    content: 'code',
                    size: 100,
                    language: 'typescript',
                    lastModified: new Date()
                }
            ];

            mockSnapshot.getFiles.mockReturnValue(testFiles);
            mockSnapshot.getFilesByPattern.mockImplementation((pattern: RegExp) => testFiles.filter(f => pattern.test(f.path)));

            const report = await analyzer.analyzeContext(mockSnapshot);
            expect(report.architecturalStyle.patterns.modular).toBeGreaterThan(0);
            expect(report.architecturalStyle.patterns.microservices).toBe(1);
            expect(report.architecturalStyle.patterns.eventDriven).toBe(0);
        });
    });
    describe('advanced pattern detection', () => {
        test('handles nested architectures', async () => {
            const testFiles = [
                {
                    path: '/modules/auth/controllers/UserController.ts',
                    content: 'import UserService from "../services/UserService"',
                    size: 100,
                    language: 'typescript',
                    lastModified: new Date()
                }
            ];

            mockSnapshot.getFiles.mockReturnValue(testFiles);
            mockSnapshot.getFilesByPattern.mockImplementation((pattern: RegExp) =>
                testFiles.filter(f => pattern.test(f.path))
            );

            const report = await analyzer.analyzeContext(mockSnapshot);
            expect(report.architecturalStyle.patterns.modular).toBe(1);
            expect(report.architecturalStyle.patterns.mvc).toBe(1);
        });

        test('correctly parses imports', async () => {
            const testFiles = [
                {
                    path: '/services/UserService.ts',
                    content: `
                        import { User } from '../models/User';
                        import { injectable } from 'tsyringe';
                        import * as lodash from 'lodash';`,
                    size: 100,
                    language: 'typescript',
                    lastModified: new Date()
                }
            ];

            mockSnapshot.getFiles.mockReturnValue(testFiles);
            mockSnapshot.getFilesByPattern.mockImplementation((pattern: RegExp) =>
                testFiles.filter(f => pattern.test(f.path))
            );

            const report = await analyzer.analyzeContext(mockSnapshot);
            expect(report.dependencyGraph.edges.size).toBe(3);
        });
    });

    test('resolves relative import paths correctly', async () => {
        jest.mock('path', () => ({
            resolve: (dir: string, importPath: string) =>
                [dir, importPath].join('/').replace(/\\/g, '/'),
            dirname: (p: string) => p.split('/').slice(0, -1).join('/')
        }));

        const testFiles = [{
            path: 'src/services/UserService.ts',
            content: `import {User} from '../models/User'`,
            size: 100,
            language: 'typescript',
            lastModified: new Date()
        }];

        mockSnapshot.getFiles.mockReturnValue(testFiles);
        const report = await analyzer.analyzeContext(mockSnapshot);

        const edge = Array.from(report.dependencyGraph.edges.values())[0];
        expect(edge.from).toBe('src/services/UserService.ts');
        expect(edge.to).toBe('src/models/User');
    });
    test('handles circular dependencies', async () => {
        const testFiles = [
            {
                path: 'a.ts',
                content: 'import {B} from "./b"',
                size: 100,
                language: 'typescript',
                lastModified: new Date()
            },
            {
                path: 'b.ts',
                content: 'import {A} from "./a"',
                size: 100,
                language: 'typescript',
                lastModified: new Date()
            }
        ];

        mockSnapshot.getFiles.mockReturnValue(testFiles);
        const report = await analyzer.analyzeContext(mockSnapshot);

        const edges = Array.from(report.dependencyGraph.edges.values());
        expect(edges).toHaveLength(2);
        expect(edges.some(e => e.from === 'a.ts' && e.to === 'b')).toBe(true);
        expect(edges.some(e => e.from === 'b.ts' && e.to === 'a')).toBe(true);
    });

    test('handles malformed imports gracefully', async () => {
        const testFiles = [
            { 
                path: 'bad.ts',
                content: `
                    import broken from "..";
                    import {from './missing';
                    import * as from 'invalid'
                `,
                size: 100,
                language: 'typescript',
                lastModified: new Date()
            }
        ];
    
        mockSnapshot.getFiles.mockReturnValue(testFiles);
        const report = await analyzer.analyzeContext(mockSnapshot);
        
        const edges = Array.from(report.dependencyGraph.edges.values());
        expect(edges).toHaveLength(0);
    });

    describe('dispose', () => {
        it('should clean up resources', () => {
            analyzer.dispose();
            // Add specific cleanup verification as needed
        });
    });
});