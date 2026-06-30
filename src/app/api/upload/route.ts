import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/api-auth';
import { Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user || user.role === Role.VIEWER) {
      return NextResponse.json(
        { error: 'غير مصرح لك بفرز الملفات أو تحميلها' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرسال أي ملف' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم الملف يتجاوز الحد المسموح به (10 ميجابايت)' },
        { status: 400 }
      );
    }

    // Validate extension
    const ext = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.docx', '.mp4'];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let filename = `${uniqueSuffix}${ext}`;
    let filePath = path.join(uploadDir, filename);

    // Apply Watermark for images
    let finalBuffer = buffer;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    if (imageExtensions.includes(ext)) {
      try {
        let image = sharp(buffer);
        
        // Optimize for Web: Resize to max width and convert to WebP
        image = image.resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 });
        finalBuffer = await image.toBuffer();
        
        // Update filename and path for WebP
        filename = `${uniqueSuffix}.webp`;
        filePath = path.join(uploadDir, filename);
        
        // Re-read metadata from the newly resized/converted buffer for the watermark
        image = sharp(finalBuffer);
        const metadata = await image.metadata();

        const logoPath = path.join(process.cwd(), 'public', 'logo-white.png');
        if (fs.existsSync(logoPath)) {
          if (metadata.width && metadata.height) {
            // Resize logo to ~20% of image width
            const logoWidth = Math.round(metadata.width * 0.20);
            
            const logoBuffer = await sharp(logoPath)
              .resize({ width: logoWidth })
              .toBuffer();

            // Set offset away from right edge (~3.5% of width, min 15px)
            const leftOffset = metadata.width - logoWidth - Math.max(15, Math.round(metadata.width * 0.035));
            // Set offset further down from top (~12% of height, min 20px)
            const topOffset = Math.max(20, Math.round(metadata.height * 0.12));

            finalBuffer = await image
              .composite([
                {
                  input: logoBuffer,
                  top: topOffset,
                  left: leftOffset,
                }
              ])
              .toBuffer();
          }
        }
      } catch (watermarkErr) {
        console.error('Image processing error:', watermarkErr);
        // Fallback to original buffer if sharp fails
      }
    }

    // Save file
    fs.writeFileSync(filePath, finalBuffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      url: fileUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الملف' },
      { status: 500 }
    );
  }
}
