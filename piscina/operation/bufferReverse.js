
export function bufferReverse(arrayBuffer) {
  console.log('bufferReverse input:', arrayBuffer);
  const res = Buffer.from(arrayBuffer).reverse();
  console.log('bufferReverse output:', res);
  return res;
}
