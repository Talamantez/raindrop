// src/__mocks__/vscode.ts
export const workspace = {
    findFiles: jest.fn(),
    openTextDocument: jest.fn(),
    workspaceFolders: [],
  };
  
  export const window = {
    createStatusBarItem: jest.fn(),
    showErrorMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
  };
  
  export const Disposable = jest.fn();
  export const StatusBarAlignment = { Left: 1, Right: 2 };
  
  export const commands = {
    registerCommand: jest.fn(),
  };
  
  export const Uri = {
    file: jest.fn(),
  };