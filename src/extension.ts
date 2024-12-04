import * as vscode from 'vscode';
import { SpecAnalyzer } from './SpecAnalyzer';
import { CommandManager } from './managers/CommandManager';
import { ReportManager } from './managers/ReportManager';
export async function activate(context: vscode.ExtensionContext) {
    // Core services
    const specAnalyzer = new SpecAnalyzer(context);
    const reportManager = new ReportManager(context);
    const commandManager = new CommandManager(context);

    // Register commands
    await commandManager.registerCommands({
        'repo-scaffold.analyze': async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('Please open a workspace first');
                return;
            }

            try {
                // Show progress during analysis
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Analyzing Repository...",
                    cancellable: true
                }, async (progress, token) => {
                    const analysis = await specAnalyzer.analyzeRepo();
                    await reportManager.showAnalysisReport(analysis);
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Analysis failed: ${message}`);
            }
        },

        'repo-scaffold.generateReport': async () => {
            try {
                await reportManager.generateReport();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Report generation failed: ${message}`);
            }
        }
    });

    // Track disposables
    context.subscriptions.push(specAnalyzer, reportManager, commandManager);
}

export function deactivate() {
    // Cleanup happens automatically through disposables
}