import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getUploadRoot } from "@/lib/paths/data-dir";

const UPLOAD_ROOT = getUploadRoot();

function s3Client(): S3Client | null {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

export function useObjectStorage(): boolean {
  return s3Client() !== null;
}

export async function saveUpload(
  userId: string,
  buffer: Buffer,
  originalName: string
): Promise<{ storageKey: string; mimeType: string; fileNameOriginal: string }> {
  const key = `${userId}/${randomUUID()}.pdf`;
  const mimeType = "application/pdf";

  const client = s3Client();
  const bucket = process.env.S3_BUCKET;

  if (client && bucket) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return { storageKey: key, mimeType, fileNameOriginal: originalName };
  }

  const dir = path.join(UPLOAD_ROOT, userId);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return { storageKey: key, mimeType, fileNameOriginal: originalName };
}

const PRACTICE_AUDIO_MAX_BYTES = 8 * 1024 * 1024;

const PRACTICE_AUDIO_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

export function isAllowedPracticeAudio(mimeType: string) {
  return mimeType in PRACTICE_AUDIO_MIME;
}

export async function savePracticeAudio(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ storageKey: string; mimeType: string }> {
  if (!isAllowedPracticeAudio(mimeType)) {
    throw new Error("Unsupported audio format. Use MP3, WAV, WebM, M4A, or OGG.");
  }
  if (buffer.byteLength > PRACTICE_AUDIO_MAX_BYTES) {
    throw new Error("Audio clip too large (max 8MB)");
  }

  const ext = PRACTICE_AUDIO_MIME[mimeType] ?? "bin";
  const key = `${userId}/practice/${randomUUID()}.${ext}`;

  const client = s3Client();
  const bucket = process.env.S3_BUCKET;

  if (client && bucket) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return { storageKey: key, mimeType };
  }

  const fullPath = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return { storageKey: key, mimeType };
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveProfileAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ storageKey: string }> {
  const ext = AVATAR_MIME[mimeType];
  if (!ext) throw new Error("Unsupported image type");
  if (buffer.byteLength > AVATAR_MAX_BYTES) throw new Error("Image too large");

  const key = `${userId}/avatar/${randomUUID()}.${ext}`;

  const client = s3Client();
  const bucket = process.env.S3_BUCKET;

  if (client && bucket) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return { storageKey: key };
  }

  const fullPath = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return { storageKey: key };
}

export async function getStoredFileBuffer(storageKey: string): Promise<Buffer> {
  const client = s3Client();
  const bucket = process.env.S3_BUCKET;

  if (client && bucket) {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty body");
    return Buffer.from(bytes);
  }

  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  return readFile(fullPath);
}

export async function getFileBuffer(storageKey: string, userId: string): Promise<Buffer> {
  if (!storageKey.startsWith(`${userId}/`)) {
    throw new Error("Forbidden");
  }

  return getStoredFileBuffer(storageKey);
}

export { PRACTICE_AUDIO_MAX_BYTES };
