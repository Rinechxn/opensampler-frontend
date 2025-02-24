import { useState } from 'react';
import JSZip from 'jszip';

export interface OSMPData {
  version: string;
  type: 'drum-machine' | 'rack';
  name: string;
  data: any;
}

export const useOSMP = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createOSMP = async (name: string, data: any, sampleFiles: { [key: string]: Blob }) => {
    const zip = new JSZip();

    // Add data.json
    const osmpData: OSMPData = {
      version: '1.0.0',
      type: 'drum-machine',
      name,
      data
    };
    zip.file('data.json', JSON.stringify(osmpData, null, 2));

    // Add state.xml (for future compatibility)
    const stateXML = `<?xml version="1.0" encoding="UTF-8"?>
<state version="1.0.0">
  <project name="${name}" />
</state>`;
    zip.file('state.xml', stateXML);

    // Add samples folder with audio files
    const samplesFolder = zip.folder('samples');
    if (samplesFolder) {
      for (const [filename, blob] of Object.entries(sampleFiles)) {
        samplesFolder.file(filename, blob);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  };

  const loadOSMP = async (file: File): Promise<{ data: OSMPData; samples: { [key: string]: string } }> => {
    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Load data.json
      const dataFile = await zip.file('data.json')?.async('string');
      if (!dataFile) throw new Error('Invalid OSMP file: missing data.json');
      const data: OSMPData = JSON.parse(dataFile);

      // Load samples
      const samples: { [key: string]: string } = {};
      const samplesFolder = zip.folder('samples');
      if (samplesFolder) {
        const sampleFiles = Object.keys(samplesFolder.files).filter(path => path.startsWith('samples/'));
        for (const path of sampleFiles) {
          const blob = await zip.file(path)?.async('blob');
          if (blob) {
            samples[path.replace('samples/', '')] = URL.createObjectURL(blob);
          }
        }
      }

      return { data, samples };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createOSMP,
    loadOSMP,
    isLoading
  };
};
