
import * as path from 'path';
import * as fs from 'fs';
import Aika from '..';

/**
 * Bridge class for interacting with the native sampler module
 */
export class SampleParser implements Aika.SampleParser {
  private parser: any;

  constructor() {
    this.parser = new Aika.SampleParserNative();
  }

  /**
   * Parse a single audio file and return sample data
   * @param filePath Path to the audio file
   */
  async parseSampleFile(filePath: string): Promise<Aika.SampleData> {
    return new Promise((resolve, reject) => {
      this.parser.parseSampleFile(filePath, (err: Error, result: Aika.SampleData) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Parse all audio files in a directory
   * @param folderPath Path to the folder containing audio files
   */
  async parseSampleFolder(folderPath: string): Promise<Aika.SampleData[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(folderPath, async (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        const audioFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.wav', '.aiff', '.flac', '.mp3'].includes(ext);
        });

        try {
          const samples = await Promise.all(
            audioFiles.map(file => this.parseSampleFile(path.join(folderPath, file)))
          );
          resolve(samples);
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });
  }

  /**
   * Analyzes filename for potential metadata like root note, velocity, etc.
   * @param filename The filename to analyze
   */
  parseFilenameMetadata(filename: string): Record<string, any> {
    return this.parser.parseFilenameMetadata(filename);
  }
}

/**
 * Factory function to create a sample parser instance
 */
export function createSampleParser(): Aika.SampleParser {
  return new SampleParser();
}
