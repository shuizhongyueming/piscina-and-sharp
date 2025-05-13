import sharp from 'sharp';

export async function sharpCompress(inputBuffer) {
  console.log('sharpCompress: input: ', inputBuffer)
  const metadata = await sharp(inputBuffer).metadata();
  console.log('sharpCompress: Metadata:', metadata.format);
  const res = await sharp(inputBuffer)
    .webp({ quality: 80 })
    .toBuffer();

  console.log('sharpCompress: Result:', res);
  return res;
}
