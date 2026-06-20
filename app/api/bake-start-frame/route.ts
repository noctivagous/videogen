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
    const identityPasses =
      body.identityPasses ??
      (body.identityPass ? [body.identityPass] : []);

    for (const pass of identityPasses) {
      if (!finalUrl) break;

      const sceneRefIndex = pass.refs.findIndex((r) => r.role === 'Backdrop' || r.role === 'Scene');
      const refs =
        sceneRefIndex >= 0
          ? pass.refs.map((r, i) => (i === sceneRefIndex ? { ...r, url: finalUrl! } : r))
          : pass.refs;

      const identityResult = await runPreviewFrameGeneration({
        ...pass,
        refs,
        cinematographyRefs: pass.cinematographyRefs ?? false,
      });
      if (identityResult.status === 'error') {
        return NextResponse.json(
          { status: 'error', error: identityResult.error ?? 'Identity pass failed' } satisfies BakeStartFrameResult,
          { status: 400 },
        );
      }
      if (identityResult.imageUrl) {
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