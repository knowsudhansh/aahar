import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ message: 'Choose an image to upload.' }, { status: 400 });
  }

  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    return NextResponse.json(
      { message: 'Only JPG, PNG, or WEBP images are allowed.' },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  if (arrayBuffer.byteLength > maxImageSizeBytes) {
    return NextResponse.json({ message: 'Image must be 5MB or smaller.' }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'restaurants');
  const filename = `${Date.now()}-${randomUUID()}${extension}`;

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), Buffer.from(arrayBuffer));

  return NextResponse.json({
    url: `/uploads/restaurants/${filename}`,
  });
}
