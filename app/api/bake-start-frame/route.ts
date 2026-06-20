import { NextResponse } from 'next/server';
import { runInpaintGeneration } from '@/lib/studio/generation/adapters/inpaint';
import { runPreviewFrameGeneration } from '@/lib/studio/generation/adapters/preview-frame';
import type { BakeStartFrameRequest, BakeStartFrameResult } from '@/lib/studio/generation/inpaint-types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BakeStartFrameRequest;
    const inpaintResult = await runInpaintGeneration(body.inpaint);
    if (inpaintResult.status === 'error') {
      return NextResponse.json(inpaintResult satisfies BakeStartFrameResult, { status: 400 });
    }

    let finalUrl = inpaintResult.imageUrl;
    if (body.identityPass && finalUrl) {
      const identityResult = await runPreviewFrameGeneration({
        ...body.identityPass,
        refs: [
          { role: 'Subject', url: body.identityPass.refs[0]?.url ?? '', slotIndex: 0 },
          { role: 'Backdrop', url: finalUrl, slotIndex: 1 },
        ],
      });
      if (identityResult.status === 'complete' && identityResult.imageUrl) {
        finalUrl = identityResult.imageUrl;
      }
    }

    return NextResponse.json({
      status: 'complete',
      imageUrl: finalUrl,
    } satisfies BakeStartFrameResult);
  } catch (e) {
    return NextResponse.json(
      {
        status: 'error',
        error: e instanceof Error ? e.message : 'Bake failed',
      } satisfies BakeStartFrameResult,
      { status: 500 },
    );
  }
}