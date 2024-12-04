// test/test-utils.ts
import * as vscode from 'vscode';

export interface CleanupOptions {
    timeout?: number;
    retryDelay?: number;
    maxRetries?: number;
}

const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
    timeout: 5000,
    retryDelay: 100,
    maxRetries: 3
};

/**
 * Thorough cleanup ensuring stable test environment
 */
export async function thoroughCleanup(options: CleanupOptions = {}): Promise<void> {
    const opts = { ...DEFAULT_CLEANUP_OPTIONS, ...options };
    const startTime = Date.now();

    while (Date.now() - startTime < opts.timeout!) {
        try {
            // Close all editors
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            
            // Force cleanup of any webview panels
            for (const panel of getAllWebviewPanels()) {
                panel.dispose();
            }

            // Wait for VS Code to process
            await new Promise(resolve => setTimeout(resolve, opts.retryDelay));

            // Verify clean state
            if (isCleanState()) {
                return;
            }
        } catch (error) {
            console.warn('Cleanup attempt failed:', error);
        }
    }

    throw new Error('Failed to achieve clean state');
}

function getAllWebviewPanels(): vscode.WebviewPanel[] {
    // This is a bit hacky but necessary for thorough cleanup
    return (vscode.window as any)._webviewPanels || [];
}

function isCleanState(): boolean {
    return vscode.window.visibleTextEditors.length === 0 &&
           getAllWebviewPanels().length === 0;
}

/**
 * Waits for UI to stabilize
 */
export async function waitForUiStable(timeout = 2000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (!isUiBusy()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('UI failed to stabilize');
}

function isUiBusy(): boolean {
    // Check various indicators of UI business
    return false; // Implement actual checks
}