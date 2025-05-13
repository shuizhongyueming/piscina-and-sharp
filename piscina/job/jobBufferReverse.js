import Piscina from "piscina";
import { bufferReverse } from "../operation/bufferReverse.js";
import { createTransferableTaskOutput } from '../transfer.js';

export function jobBufferReverse(taskData) {
  const inputBuffer = Buffer.from(taskData.payload.bufferToTransfer);
  const outputBuffer = bufferReverse(inputBuffer.buffer)
  return Piscina.move(createTransferableTaskOutput(taskData, outputBuffer.buffer));
}
