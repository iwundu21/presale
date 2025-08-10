
'use client';

import fs from 'fs';
import path from 'path';

const lockDir = path.join(process.cwd(), 'locks');
const lockFile = path.join(lockDir, 'db.lock');

// Ensure lock directory exists
if (!fs.existsSync(lockDir)) {
  fs.mkdirSync(lockDir, { recursive: true });
}

const ACQUIRE_TIMEOUT = 10000; // 10 seconds
const RETRY_DELAY = 50; // 50 ms

/**
 * Acquires a lock for the db.json file.
 * It will retry every `RETRY_DELAY` milliseconds until the lock is acquired
 * or `ACQUIRE_TIMEOUT` is reached.
 * @returns {Promise<void>}
 */
export async function acquireLock(): Promise<void> {
    const startTime = Date.now();
    while (true) {
        try {
            // 'wx' flag fails if the file path exists, providing an atomic lock check.
            fs.writeFileSync(lockFile, 'locked', { flag: 'wx' });
            return; // Lock acquired
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw e; // An actual error occurred
            }
            // Lock is held by another process
            if (Date.now() - startTime > ACQUIRE_TIMEOUT) {
                throw new Error('Could not acquire file lock: Timeout exceeded.');
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

/**
 * Releases the lock for the db.json file.
 * This is a synchronous operation.
 */
export function releaseLock(): void {
    try {
        fs.unlinkSync(lockFile);
    } catch (e) {
        // It's possible the file doesn't exist if release is called multiple times.
        // We can ignore 'ENOENT' (No such file or directory) errors.
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
           console.error('Failed to release file lock:', e);
        }
    }
}

/**
 * A wrapper function to perform an action with a lock.
 * Ensures that the lock is always released, even if the action fails.
 * @param action The async function to execute while holding the lock.
 * @returns {Promise<T>} The result of the action.
 */
export async function withLock<T>(action: () => Promise<T>): Promise<T> {
    await acquireLock();
    try {
        return await action();
    } finally {
        releaseLock();
    }
}
