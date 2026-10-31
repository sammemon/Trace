import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { PrismaService } from './prisma.service';
import { confirmUploadSchema, presignUploadSchema } from '@trace/shared';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly bucket = process.env.S3_BUCKET ?? 'trace-media';
  private readonly client = new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY } : undefined
  });

  constructor(private readonly prisma: PrismaService) {}

  async presign(userId: string, input: unknown) {
    const data = presignUploadSchema.parse(input);
    if (!allowedMimeTypes.has(data.mimeType) || data.sizeBytes < 1 || data.sizeBytes > maxBytes) throw new BadRequestException('Unsupported image type or size');
    const extension = data.mimeType.split('/')[1];
    const objectKey = `items/${userId}/${randomUUID()}.${extension}`;
    const uploadUrl = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, ContentType: data.mimeType, ContentLength: data.sizeBytes }), { expiresIn: 300 });
    return { objectKey, uploadUrl, expiresIn: 300 };
  }

  async confirm(userId: string, input: unknown) {
    const data = confirmUploadSchema.parse(input);
    const item = await this.prisma.item.findFirst({ where: { id: data.itemId, reporterId: userId } });
    if (!item) throw new ForbiddenException('Only the item owner can attach images');
    if (!data.objectKey.startsWith(`items/${userId}/`)) throw new BadRequestException('Invalid upload key');
    if (!allowedMimeTypes.has(data.mimeType) || data.sizeBytes > maxBytes) throw new BadRequestException('Unsupported image type or size');
    await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: data.objectKey }));
    const baseUrl = process.env.S3_PUBLIC_BASE_URL ?? `${process.env.S3_ENDPOINT ?? ''}/${this.bucket}`;
    const image = await this.prisma.itemImage.create({ data: { itemId: data.itemId, objectKey: data.objectKey, url: `${baseUrl}/${data.objectKey}`, mimeType: data.mimeType, sizeBytes: data.sizeBytes, position: data.position ?? 0, isCover: data.isCover ?? false } });
    return image;
  }

  async remove(userId: string, imageId: string) {
    const image = await this.prisma.itemImage.findUnique({ where: { id: imageId }, include: { item: true } });
    if (!image) throw new NotFoundException('Image not found');
    if (image.item.reporterId !== userId) throw new ForbiddenException('Only the item owner can remove images');
    await this.prisma.itemImage.delete({ where: { id: imageId } });
    return { success: true };
  }
}
