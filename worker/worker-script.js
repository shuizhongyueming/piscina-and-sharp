import { parentPort, workerData } from 'node:worker_threads';
import { compressImageWithSharp } from './imageProcessor.js';

if (!parentPort) throw new Error('This script must be run as a worker thread.');

parentPort.on('message', async (task) => {
  console.log(`[Worker ${workerData.workerId}] Received task:`, task.id, task.description);

  try {
    if (task.type === 'compress') {
      const inputImageNodeBuffer = Buffer.from(task.imageArrayBuffer); // Reconstruct Buffer from ArrayBuffer

      const compressedNodeBuffer = await compressImageWithSharp(
        inputImageNodeBuffer,
        task.applyBufferFromWorkaround
      );

      console.log(`[Worker ${workerData.workerId}] Compression successful for task ${task.id}.`, compressedNodeBuffer);

      console.log(`[Worker ${workerData.workerId}] Compression successful for task ${task.id}. Output ArrayBuffer length: ${compressedNodeBuffer.buffer.byteLength}`);
      parentPort.postMessage(
        {
          status: 'success',
          taskId: task.id,
          resultArrayBuffer: compressedNodeBuffer.buffer,
          workerId: workerData.workerId
        },
        [compressedNodeBuffer.buffer] // Transfer the ArrayBuffer
      );
    } else {
      throw new Error(`Unknown task type: ${task.type}`);
    }
  } catch (error) {
    console.error(`[Worker ${workerData.workerId}] Error processing task ${task.id}:`, error.message, error.name);
    // Try to post a structured error, but be aware this might also fail if error is non-serializable
    try {
      parentPort.postMessage({
        status: 'error',
        taskId: task.id,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          // Add any other relevant properties from the error
        },
        workerId: workerData.workerId
      });
    } catch (postErrorError) {
        // Fallback if error object itself can't be cloned
        parentPort.postMessage({
            status: 'error',
            taskId: task.id,
            error: { message: `Worker failed to process task and to serialize the original error: ${error.message}` },
            workerId: workerData.workerId
        });
    }
  }
});

console.log(`[Worker ${workerData.workerId}] Initialized and listening for messages.`);
