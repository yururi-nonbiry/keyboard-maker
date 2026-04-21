import type { KeyboardData } from '../types';

export const saveProjectFile = async (data: KeyboardData) => {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${data.metadata.name.toLowerCase().replace(/ /g, '_')}.json`,
      types: [{
        description: 'Keyboard Project File',
        accept: { 'application/json': ['.json'] },
      }],
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to save file:', err);
    return false;
  }
};

export const loadProjectFile = async (): Promise<KeyboardData | null> => {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Keyboard Project File',
        accept: { 'application/json': ['.json'] },
      }],
      multiple: false,
    });
    const file = await handle.getFile();
    const content = await file.text();
    return JSON.parse(content) as KeyboardData;
  } catch (err) {
    console.error('Failed to load file:', err);
    return null;
  }
};
