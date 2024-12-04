import * as vscode from 'vscode';
import { ContextAnalyzer } from '../ContextAnalyzer';
import { RepoSnapshot } from '../RepoSnapshot';
import { SpecAnalyzer } from '../SpecAnalyzer';
import { ReportManager } from '../managers/ReportManager';

describe('Integration Tests', () => {
    let contextAnalyzer: ContextAnalyzer;
    let specAnalyzer: SpecAnalyzer;
    let reportManager: ReportManager;
    let mockSnapshot: RepoSnapshot;

    beforeEach(() => {
        // Setup mock VSCode workspace
        (vscode.workspace as any).workspaceFolders = [{
            uri: { fsPath: '/mock/workspace' },
            name: 'mock',
            index: 0
        }];

        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: jest.fn(),
                update: jest.fn()
            },
            extensionPath: '/mock/extension'
        };

        contextAnalyzer = new ContextAnalyzer();
        specAnalyzer = new SpecAnalyzer(mockContext as any);
        reportManager = new ReportManager(mockContext as any);

        mockSnapshot = {
            getFiles: jest.fn().mockReturnValue([]),
            getFilesByPattern: jest.fn().mockReturnValue([]),
            capture: jest.fn().mockResolvedValue(undefined),
            dispose: jest.fn()
        } as any as RepoSnapshot;

        // Setup mock status bar
        const mockStatusBar = {
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        };
        (specAnalyzer as any)._statusBar = mockStatusBar;

        // Mock workspace.findFiles to return mock files
        (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([
            { fsPath: '/mock/workspace/src/models/User.ts' },
            { fsPath: '/mock/workspace/src/controllers/UserController.ts' },
            { fsPath: '/mock/workspace/src/views/UserView.tsx' }
        ]);

        // Mock openTextDocument
        (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({
            getText: () => 'mock content',
            languageId: 'typescript'
        });
    });

    afterEach(() => {
        contextAnalyzer.dispose();
        specAnalyzer.dispose();
        reportManager.dispose();
        // Reset workspace mock
        (vscode.workspace as any).workspaceFolders = undefined;
    });

    test('full analysis workflow', async () => {
        // Mock repository structure
        mockSnapshot.capture = jest.fn().mockResolvedValue({
            files: [
                {
                    path: 'src/models/User.ts',
                    content: 'export class User {}',
                    size: 100, 
                    language: 'typescript'
                },
                {
                    path: 'src/controllers/UserController.ts',
                    content: 'import { User } from "../models/User";', // Add semicolon
                    size: 200,
                    language: 'typescript'
                },
                {
                    path: 'src/views/UserView.tsx',
                    content: 'import { User } from "../models/User";', // Add semicolon 
                    size: 300,
                    language: 'typescript'
                }
            ]
        });

        // Test full analysis workflow
        const analysisResult = await specAnalyzer.analyzeRepo();

        // Verify context analysis results
        expect(analysisResult.context.architecturalStyle.primaryStyle).toBe('mvc');
        expect(analysisResult.context.dependencyGraph.edges.size).toBe(2);

        // Verify pattern detection
        expect(analysisResult.patterns).toBeDefined();
        expect(analysisResult.specifications).toBeDefined();

        // Test report generation
        const report = await reportManager.generateReport();
        expect(report).toBeDefined();
    });

    test('handles various file structures', async () => {
        mockSnapshot.capture = jest.fn().mockResolvedValue({
            files: [
                {
                    path: 'modules/auth/index.ts',
                    content: 'export * from "./auth.service"',
                    size: 100,
                    language: 'typescript'
                },
                {
                    path: 'modules/users/index.ts',
                    content: 'export * from "./users.service"',
                    size: 100,
                    language: 'typescript'
                }
            ]
        });

        const analysisResult = await specAnalyzer.analyzeRepo();
        expect(analysisResult.context.architecturalStyle.primaryStyle).toBe('modular');
    });

    test('error propagation', async () => {
        const mockError = new Error('Mock error');
        
        // Mock the entire snapshot to fail
        jest.spyOn(RepoSnapshot.prototype, 'capture')
            .mockRejectedValueOnce(mockError);
    
        await expect(specAnalyzer.analyzeRepo())
            .rejects
            .toThrow('Mock error');
    });
});