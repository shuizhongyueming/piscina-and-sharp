import { transferableSymbol, valueSymbol } from 'piscina';

export function createTransferableTaskInput(taskData) {
  if (!taskData || !taskData.payload || !taskData.payload.bufferToTransfer) {
    throw new Error("Invalid complexData structure for createTransferableTaskInput");
  }
  return {
    get [transferableSymbol]() {
      return [taskData.payload.bufferToTransfer];
    },
    get [valueSymbol]() {
      return taskData;
    }
  };
}

export function createTransferableTaskOutput(taskData, arrayBuffer) {
  console.log('createTransferableTaskOutput', { taskData, arrayBuffer });
  return {
      get [transferableSymbol]() {
        return [arrayBuffer];
      },
      get [valueSymbol]() {
        return {
          taskId: taskData.id,
          originalDescription: taskData.payload.description,
          arrayBuffer,
          timestamp: new Date(),
        };
      }
    };
}
