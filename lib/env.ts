import path from 'path';

/**
 * Validates and returns the DRAWINGS_DIR environment variable
 * @throws {Error} If DRAWINGS_DIR is not set or is empty
 * @returns The validated and resolved drawings directory path
 */
export function getDrawingsDir(): string {
  if (!process.env.DRAWINGS_DIR) {
    throw new Error(
      'DRAWINGS_DIR environment variable is not set!\n\n' +
        'Please create a .env file in the project root with:\n' +
        'DRAWINGS_DIR=/path/to/your/drawings\n\n' +
        'Example:\n' +
        'DRAWINGS_DIR=/Users/username/drawings\n' +
        'or\n' +
        'DRAWINGS_DIR=./drawings'
    );
  }

  const drawingsDir = process.env.DRAWINGS_DIR.trim();

  if (!drawingsDir) {
    throw new Error(
      'DRAWINGS_DIR environment variable is set but empty!\n\n' +
        'Please set DRAWINGS_DIR to a valid directory path in your .env file.'
    );
  }

  // If it's an absolute path, use it as-is
  if (path.isAbsolute(drawingsDir)) {
    return drawingsDir;
  }

  // If it's relative, resolve it relative to the project root (process.cwd())
  return path.resolve(process.cwd(), drawingsDir);
}
