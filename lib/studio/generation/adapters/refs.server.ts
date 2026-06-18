import fs from 'fs';
import path from 'path';
import type { GenerationRequest } from '@/lib/studio/generation/types';

export function pickImageInput(refs: GenerationRequest['refs']): string | undefined {
  const subject = refs.find((r) => r.role === 'Subject');
  if (subject?.url) return subject.url;
  const backdrop = refs.find((r) => r.role === 'Backdrop');
  if (backdrop?.url) return backdrop.url;
  return refs[0]?.url;
}

export function resolveRefUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(url).slice(1).toLowerCase() || 'jpeg';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}