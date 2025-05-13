import { Worker } from 'node:worker_threads';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_WORKERS = 1; // Or os.cpus().length;
const TASKS_PER_WORKER = 1;
// Toggle this to test the workaround
const APPLY_BUFFER_FROM_WORKAROUND_IN_WORKER = process.env.APPLY_WORKAROUND === 'true';


async function run() {
  console.log(`Running with Node.js version: ${process.version}`);
  console.log(`APPLY_BUFFER_FROM_WORKAROUND_IN_WORKER: ${APPLY_BUFFER_FROM_WORKAROUND_IN_WORKER}`);

  const imagePath = path.join(__dirname, 'helen-van-yH6pheDeWyU-unsplash.jpg'); // Reuse image

  const workers = [];
  const promises = [];
  let tasksSent = 0;
  const imageFileBuffer = await fs.readFile(imagePath);

  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker(path.resolve(__dirname, 'worker-script.js'), {
      workerData: { workerId: `W${i+1}` }
    });

    worker.on('message', (message) => {
      console.log(`[Main] Received message from ${message.workerId} for task ${message.taskId}: Status: ${message.status}`);
      if (message.status === 'success') {
        console.log(`  Result ArrayBuffer length: ${message.resultArrayBuffer?.byteLength}`);
        // Here you would typically use Buffer.from(message.resultArrayBuffer)
      } else if (message.status === 'error') {
        console.error(`  Error from worker: ${message.error?.name} - ${message.error?.message}`);
        console.error(`  Worker error stack: ${message.error?.stack}`);
        // Check if the error object is empty/minimal
        if (Object.keys(message.error || {}).length <= 1 && !message.error?.message && !message.error?.name) {
            console.error('  [Main] DETECTED POTENTIALLY EMPTY/MINIMAL ERROR OBJECT FROM WORKER!');
        }
        console.error('  Raw error object from worker:', message.error);
      }
    });

    worker.on('error', (err) => {
      // This is for unhandled errors in the worker that cause it to terminate
      console.error(`[Main] Worker ${worker.threadId} unhandled error:`, err);
    });

    worker.on('exit', (code) => {
      console.log(`[Main] Worker ${worker.threadId} exited with code ${code}`);
    });

    workers.push(worker);

    for (let j = 0; j < TASKS_PER_WORKER; j++) {
      const taskId = `task-${i * TASKS_PER_WORKER + j + 1}`;

      // Crucially, get the underlying ArrayBuffer from the Node.js Buffer for transfer
      const imageArrayBuffer = imageFileBuffer.buffer.slice(
        imageFileBuffer.byteOffset,
        imageFileBuffer.byteOffset + imageFileBuffer.byteLength
      );

      const task = {
        id: taskId,
        type: 'compress',
        description: `Compressing image for task ${taskId}`,
        imageArrayBuffer: imageArrayBuffer, // Send ArrayBuffer
        applyBufferFromWorkaround: APPLY_BUFFER_FROM_WORKAROUND_IN_WORKER
      };

      console.log(`[Main] Sending task ${taskId} to Worker ${i+1} (threadId: ${worker.threadId})`);
      // Post message with the ArrayBuffer in the transferList
      worker.postMessage(task, [task.imageArrayBuffer]);
      tasksSent++;

      // Create a promise that resolves when this specific task is done (or errors)
      // This is a simplified way to wait for all tasks.
      // A more robust solution would map task IDs to resolve/reject functions.
      promises.push(new Promise((resolve, reject) => {
        const messageHandler = (msg) => {
          if (msg.taskId === taskId) {
            if (msg.status === 'success') resolve(msg);
            else reject(msg.error || new Error('Unknown worker error'));
            worker.removeListener('message', messageHandler); // Clean up listener
          }
        };
        worker.on('message', messageHandler);
      }));
    }
  }

  console.log(`[Main] All ${tasksSent} tasks sent. Waiting for results...`);

  try {
    await Promise.allSettled(promises); // Wait for all tasks to complete or fail
    console.log('[Main] All task promises settled.');
  } catch (e) {
      console.error("[Main] Error in Promise.allSettled (should not happen with allSettled):", e);
  }


  console.log('[Main] Terminating workers...');
  await Promise.all(workers.map(w => w.terminate()));
  console.log('[Main] All workers terminated.');
  console.log('\n--- Simplified test finished ---');
}

run().catch(err => {
  console.error('[Main] Unhandled critical error in main execution (simplified test):', err);
  process.exit(1);
});
