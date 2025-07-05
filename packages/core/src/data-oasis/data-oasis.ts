/**
 * Data Oasis - Local-first knowledge base for Eidolon CLI
 * File-based storage implementation for the core engine
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Interface for the Data Oasis - the local-first knowledge base.
 * This provides the abstraction for storing and retrieving data.
 */
export interface DataOasis {
  /**
   * Get a value by key.
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set a value for a key.
   */
  set<T = any>(key: string, value: T): Promise<void>;

  /**
   * Log an interaction or event.
   */
  log(entry: LogEntry): Promise<void>;

  /**
   * Get logged entries with optional filtering.
   */
  getLogs(filter?: LogFilter): Promise<LogEntry[]>;

  /**
   * Check if a key exists.
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a key.
   */
  delete(key: string): Promise<boolean>;

  /**
   * List all keys with optional prefix filter.
   */
  keys(prefix?: string): Promise<string[]>;
}

/**
 * Log entry for tracking interactions and events.
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'interaction' | 'system' | 'error' | 'custom';
  data: any;
  tags?: string[];
  sessionId?: string;
}

/**
 * Filter options for retrieving log entries.
 */
export interface LogFilter {
  type?: LogEntry['type'];
  tags?: string[];
  sessionId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

/**
 * File-based implementation of the Data Oasis.
 * Stores data as JSON files in the user's home directory.
 */
export class FileDataOasis implements DataOasis {
  private readonly dataDir: string;
  private readonly logsDir: string;

  constructor(baseDir?: string) {
    const eidolonDir = baseDir || path.join(os.homedir(), '.eidolon');
    this.dataDir = path.join(eidolonDir, 'data');
    this.logsDir = path.join(eidolonDir, 'logs');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.logsDir, { recursive: true });
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const filePath = this.getDataPath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    await this.initialize();
    const filePath = this.getDataPath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  async log(entry: LogEntry): Promise<void> {
    await this.initialize();
    const logFile = path.join(this.logsDir, `${entry.timestamp.toISOString().split('T')[0]}.jsonl`);
    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    }) + '\n';
    await fs.appendFile(logFile, logLine, 'utf-8');
  }

  async getLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    try {
      const logFiles = await fs.readdir(this.logsDir);
      const entries: LogEntry[] = [];

      for (const file of logFiles.filter(f => f.endsWith('.jsonl'))) {
        const filePath = path.join(this.logsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        for (const line of content.trim().split('\n').filter(Boolean)) {
          try {
            const entry = JSON.parse(line);
            entry.timestamp = new Date(entry.timestamp);
            
            if (this.matchesFilter(entry, filter)) {
              entries.push(entry);
            }
          } catch (error) {
            // Skip malformed log lines
            continue;
          }
        }
      }

      // Sort by timestamp (newest first) and apply limit
      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      if (filter.limit && filter.limit > 0) {
        return entries.slice(0, filter.limit);
      }
      
      return entries;
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      await fs.access(this.getDataPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(this.getDataPath(key));
      return true;
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async keys(prefix?: string): Promise<string[]> {
    try {
      const allFiles = await this.getAllDataFiles(this.dataDir);
      const keys = allFiles
        .map(filePath => this.filePathToKey(filePath))
        .filter(key => !prefix || key.startsWith(prefix));
      
      return keys;
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private getDataPath(key: string): string {
    // Convert key to safe file path
    const safePath = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.dataDir, `${safePath}.json`);
  }

  private filePathToKey(filePath: string): string {
    const relativePath = path.relative(this.dataDir, filePath);
    return relativePath.replace(/\.json$/, '').replace(/_/g, '/');
  }

  private async getAllDataFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.getAllDataFiles(fullPath));
        } else if (entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is empty
    }
    
    return files;
  }

  private matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (filter.type && entry.type !== filter.type) {
      return false;
    }
    
    if (filter.sessionId && entry.sessionId !== filter.sessionId) {
      return false;
    }
    
    if (filter.tags && filter.tags.length > 0) {
      const entryTags = entry.tags || [];
      const hasAllTags = filter.tags.every(tag => entryTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    
    if (filter.since && entry.timestamp < filter.since) {
      return false;
    }
    
    if (filter.until && entry.timestamp > filter.until) {
      return false;
    }
    
    return true;
  }
}