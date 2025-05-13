import Piscina from "piscina";
import { sharpCompress } from "../operation/sharpCompress.js";
import { createTransferableTaskOutput } from '../transfer.js';

export async function jobSharpCompress(taskData) {
  const inputBuffer = Buffer.from(taskData.payload.bufferToTransfer);
  const outputBuffer = await sharpCompress(inputBuffer)
  console.log('jobSharpCompress: before move');
  const res = Piscina.move(createTransferableTaskOutput(taskData, outputBuffer.buffer));
  console.log('jobSharpCompress: after move');
  return res;
}
