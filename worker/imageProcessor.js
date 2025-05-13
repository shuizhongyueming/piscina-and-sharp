import sharp from 'sharp';

/**
 * Compresses an image buffer using sharp.
 * @param {Buffer} inputImageBuffer - The input image as a Node.js Buffer.
 * @param {boolean} applyBufferFromWorkaround - Whether to apply the Buffer.from() workaround.
 * @returns {Promise<Buffer>} - The compressed image as a Node.js Buffer.
 */
export async function compressImageWithSharp(inputImageBuffer, applyBufferFromWorkaround = false) {
  console.log(`[imageProcessor] Received buffer for compression, length: ${inputImageBuffer.length}, applyWorkaround: ${applyBufferFromWorkaround}`);

  if (!(inputImageBuffer instanceof Buffer)) {
    throw new TypeError("inputImageBuffer must be a Node.js Buffer.");
  }
  if (inputImageBuffer.length === 0) {
    throw new Error("Input image buffer is empty.");
  }

  let compressedBuffer = await sharp(inputImageBuffer)
    .webp({ quality: 75 })
    .toBuffer();

  console.log(`[imageProcessor] Compressed with sharp, output length: ${compressedBuffer.length}`);

  if (applyBufferFromWorkaround) {
    console.log('[imageProcessor] Applying Buffer.from() workaround...');
    const originalLength = compressedBuffer.length;
    compressedBuffer = Buffer.from(compressedBuffer); // The workaround
    console.log(`[imageProcessor] Workaround applied. Buffer length before: ${originalLength}, after: ${compressedBuffer.length}`);
  }

  return compressedBuffer;
}
