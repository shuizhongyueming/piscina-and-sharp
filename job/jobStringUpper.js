import { stringUpper } from "../operation/stringUpper.js";

export async function jobStringUpper(data) {
  const inputString = data.message;
  const outputString = stringUpper(inputString);
  return {
    original: data.message,
    transformed: outputString,
    timestamp: new Date(),
    workerPid: process.pid,
  };
}
