// jest.setup.js

// Set up path for vscode mock
const mockVSCode = {
    Disposable: jest.fn(),
    window: {
        createStatusBarItem: jest.fn(),
        showErrorMessage: jest.fn()
    },
    workspace: {
        workspaceFolders: [],
        findFiles: jest.fn()
    },
    commands: {
        registerCommand: jest.fn()
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    }
};

jest.mock('vscode', () => mockVSCode);