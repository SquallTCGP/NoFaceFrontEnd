/**
 * Web File Service
 * 
 * Provides functions for file operations in a web environment — works in both Tauri and browser (Vite dev)
 */

// Check if the current environment is Tauri
const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Download content as a file in a browser environment
 * @param {string} content - Content to download
 * @param {string} filename - Name of the file
 */
export const downloadFile = async (content: string, filename: string): Promise<void> => {
  if (isTauri()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: filename,
      });

      if (filePath) {
        await writeTextFile(filePath, content);
        console.log('File saved successfully (Tauri)');
      }
    } catch (error) {
      console.error('Tauri error saving file:', error);
      throw error;
    }
  } else {
    try {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      console.log('File saved successfully (browser)');
    } catch (error) {
      console.error('Browser error saving file:', error);
      throw error;
    }
  }
};

/**
 * Read a file using the browser's File API
 * @returns {Promise<string>} The content of the file
 */
export const readFile = async (): Promise<string> => {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await open({
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (typeof filePath === 'string') {
        return await readTextFile(filePath);
      }

      throw new Error('No file selected');
    } catch (error) {
      console.error('Tauri error reading file:', error);
      throw error;
    }
  } else {
    // Browser fallback using a file input
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
      };

      input.click();
    });
  }
};
