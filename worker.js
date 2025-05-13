import Piscina from 'piscina';
import { createTransferableTaskInput } from './transfer.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const piscina = new Piscina({
  filename: path.resolve(__dirname, 'job/mod.js'),
});

// No NonStandardError needed if we're not intentionally throwing them from business logic

export async function stringUpperTask(data) {
  console.log(`[Worker] Received data for stringUpperTask:`, data);

  return await piscina.run(data, { name: 'jobStringUpper' });
}

export async function bufferTask(taskData) {
  console.log(`[Worker] Received data for bufferTask:`, taskData);

  return piscina.run(Piscina.move(createTransferableTaskInput(taskData)), {
    name: 'jobBufferReverse'
  });
}

export async function sharpTask(taskData) {
  console.log(`[Worker] Received data for sharpTask:`, taskData);

  return piscina.run(Piscina.move(createTransferableTaskInput(taskData)), {
    name: 'jobSharpCompress'
  });
}
