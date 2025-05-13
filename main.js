import fs from 'node:fs/promises';
import { bufferTask, sharpTask, stringUpperTask } from './worker.js';


async function runTest(taskName, inputDataGenerator, expectError = false) { // expectError is now false by default
  const taskData = await inputDataGenerator();
  const taskId = taskData?.id || taskName; // Use taskData.id if available
  console.log(`\n--- Running test: ${taskName} (ID: ${taskId}) ---`);
  console.log(`[Main] Input for ${taskId}:`, JSON.stringify(taskData, (key, value) =>
    value instanceof ArrayBuffer ? `ArrayBuffer(size:${value.byteLength})` : value, 2));

  try {
    let result;
    if (taskName === 'bufferTask') {
      result = await bufferTask(taskData);
    } else if (taskName === 'sharpTask') {
      result = await sharpTask(taskData);
    } else {
      result = await stringUpperTask(taskData);
    }

    console.log(`[Main] Task ${taskName} (ID: ${taskId}) completed successfully.`);
    console.log(`[Main] Result for ${taskId}:`, JSON.stringify(result, (key, value) => {
        if (value && value.type === 'Buffer' && Array.isArray(value.data)) { // Handle Node.js Buffer stringification
            return `Buffer(size:${value.data.length})`;
        }
        if (value instanceof ArrayBuffer) {
            return `ArrayBuffer(size:${value.byteLength})`;
        }
        return value;
    }, 2));

    if (expectError) { // This case should ideally not be hit now
      console.error(`[Main] UNEXPECTED SUCCESS: Task ${taskName} (ID: ${taskId}) was expected to fail but succeeded.`);
    }
  } catch (error) { // This block is now for UNEXPECTED errors
    if (!expectError) {
      console.error(`[Main] UNEXPECTED ERROR from task ${taskName} (ID: ${taskId}):`);
    } else { // This case should ideally not be hit now
      console.error(`[Main] Caught expected error from task ${taskName} (ID: ${taskId}):`);
    }
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Name: ${error.name}`);
    console.error(`  Error Stack: ${error.stack}`);

    console.error('  Error Properties (enumerable):');
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key)) {
        try {
            if (error[key] instanceof Buffer) console.error(`    ${key}: Buffer(length:${error[key].length})`);
            else console.error(`    ${key}: ${JSON.stringify(error[key])}`);
        } catch (e) { console.error(`    ${key}: (Cannot stringify - ${typeof error[key]})`); }
      }
    }

    console.error('  Error Own Properties (all):');
    const ownPropertyNames = Object.getOwnPropertyNames(error);
    if (ownPropertyNames.length === 0 && Object.keys(error).length === 0 && !error.message && !error.name) {
        console.error('    ERROR OBJECT APPEARS EMPTY or non-standard!');
    }
    for (const key of ownPropertyNames) {
        try {
            if (error[key] instanceof Buffer) console.error(`    ${key}: Buffer(length:${error[key].length})`);
            else console.error(`    ${key}: ${JSON.stringify(error[key])}`);
        } catch (e) { console.error(`    ${key}: (Cannot stringify - ${typeof error[key]})`); }
    }
    console.error(`  Raw error object:`, error);
  }
}

async function main() {
  console.log(`Running with Node.js version: ${process.version}`);
  const arr = (new Array(1)).fill(0).map((_n, i) => i);

  // Test 1: Hello World Task (simple string manipulation)

  await Promise.all(
    arr.map(i => runTest('stringUpperTask', () => ({
      message: `${i}: Hello Piscina World from Main Thread!`
    })))
  );

  // Test 2: Buffer Task (reverse buffer content)
  await Promise.all(
    arr.map(i => runTest('bufferTask', async () => {
      const imgBuffer = await fs.readFile('./helen-van-yH6pheDeWyU-unsplash.jpg');
      return {
        id: `bufferTest-${Date.now()}`,
        payload: {
          bufferToTransfer: imgBuffer.buffer,
          description: `${i}: Buffer from JPG image`
        }
      };
    }))
  )

  // Test 3: Sharp Task (process a valid JPG)
  await Promise.all(
    arr.map(i => runTest('sharpTask', async () => {
      const imgBuffer = await fs.readFile('./helen-van-yH6pheDeWyU-unsplash.jpg');
      return {
        id: `sharpTestValidPng-${Date.now()}`,
        payload: {
          bufferToTransfer: imgBuffer.buffer,
          description: `${i}: A valid JPG image`
        }
      };
    }))
  )

  console.log('\n--- All tests finished ---');
}

main().catch(err => {
  console.error('[Main] Unhandled critical error in main execution:', err);
  process.exit(1);
});
