import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Await params if Next.js 16/15 requires it
    const { filename } = await params;
    
    // Sanitize filename to prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'screenshots', safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Screenshot file not found on disk.', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error serving dynamic screenshot:', err);
    return new NextResponse(`Error reading file: ${err.message}`, { status: 500 });
  }
}
