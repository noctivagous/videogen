import fs from 'fs';
import path from 'path';

const XAI_API = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-imagine-image-quality';

function mimeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function toDataUri(filePath) {
  const buf = fs.readFileSync(filePath);
  const mime = mimeForPath(filePath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function parseImageResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`xAI ${res.status}: ${text}`);
  }

  const data = await res.json();
  const item = data.data?.[0];
  if (!item) throw new Error('xAI returned no image');

  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error(`Failed to download xAI image: ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('xAI returned unsupported image format');
}

export async function xaiGenerate(apiKey, prompt, opts = {}) {
  const res = await fetch(`${XAI_API}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      prompt,
      aspect_ratio: opts.aspectRatio || '16:9',
      resolution: opts.resolution || '1k',
      response_format: 'b64_json',
      n: 1,
    }),
  });
  return parseImageResponse(res);
}

export async function xaiEdit(apiKey, prompt, referencePath, opts = {}) {
  const res = await fetch(`${XAI_API}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      prompt,
      image: {
        url: toDataUri(referencePath),
        type: 'image_url',
      },
      aspect_ratio: opts.aspectRatio || '16:9',
      resolution: opts.resolution || '1k',
      response_format: 'b64_json',
    }),
  });
  return parseImageResponse(res);
}

export function saveJpeg(buf, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}