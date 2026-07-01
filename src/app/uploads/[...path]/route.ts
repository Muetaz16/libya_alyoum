import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    // 1. Define the absolute base directory for uploads
    const baseUploadDir = path.resolve(process.cwd(), 'public', 'uploads');
    
    // 2. Resolve the requested file path
    const filePath = path.resolve(baseUploadDir, ...params.path);
    
    // 3. SECURITY CHECK: Prevent Directory Traversal (LFI)
    // Ensures a malicious user cannot use "../../" to read sensitive server files
    if (!filePath.startsWith(baseUploadDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 4. Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // 5. Read and serve the file safely
    const fileBuffer = fs.readFileSync(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
