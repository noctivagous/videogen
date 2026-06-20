import { NextResponse } from 'next/server';
import { runInpaintGeneration } from '@/lib/studio/generation/adapters/inpaint';
import { runPreviewFrameGeneration } from '@/lib/studio/generation/adapters/preview-frame';
import type { BakeStartFrameRequest, BakeStartFrameResult } from '@/lib/studio/generation/inpaint-types';
import type { GenerationProgressReporter } from '@/lib/studio/generation/progress';
import {
  createNdjsonProgressStreamResponse,
  wantsProgressStream,
} from '@/lib/studio/generation/progress-stream.server';

async function runBakeStartFrame(
  body: BakeStartFrameRequest,
  report: GenerationProgressReporter,
): Promise<BakeStartFrameResult> {
  const inpaintResult = await runInpaintGeneration({
    ...body.inpaint,
    onProgress: report,
  });
  if (inpaintResult.status === 'error') {
    return { status: 'error', error: inpaintResult.error ?? 'Pass 1 failed' };
  }

  let finalUrl = inpaintResult.imageUrl;
  const identityPasses =
    body.identityPasses ?? (body.identityPass ? [body.identityPass] : []);

  if (identityPasses.length === 0) {
    report({
      message: 'Bake complete',
      detail: 'No character identity pass — using Pass 1 result only',
    });
  }

  for (let i = 0; i < identityPasses.length; i++) {
    if (!finalUrl) break;
    const pass = identityPasses[i]!;
    const passNum = i + 1;

    report({
      message: `Pass 2: Applying character identity (${passNum}/${identityPasses.length})`,
      detail: `${pass.refs.filter((r) => r.role === 'Subject').length} character sheet(s) + baked scene`,
    });

    const sceneRefIndex = pass.refs.findIndex((r) => r.role === 'Backdrop' || r.role === 'Scene');
    const refs =
      sceneRefIndex >= 0
        ? pass.refs.map((r, idx) => (idx === sceneRefIndex ? { ...r, url: finalUrl! } : r))
        : pass.refs;

    const identityResult = await runPreviewFrameGeneration({
      ...pass,
      refs,
      cinematographyRefs: pass.cinematographyRefs ?? false,
      onProgress: (update) => {
        report({
          message: `Pass 2 (${passNum}/${identityPasses.length}): ${update.message}`,
          detail: update.detail,
        });
      },
    });

    if (identityResult.status === 'error') {
      return { status: 'error', error: identityResult.error ?? 'Identity pass failed' };
    }
    if (identityResult.imageUrl) {
      finalUrl = identityResult.imageUrl;
    }
  }

  if (identityPasses.length > 0) {
    report({ message: 'Bake complete', detail: 'Start frame locked with character identity applied' });
  }

  return {
    status: 'complete',
    imageUrl: finalUrl,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BakeStartFrameRequest & { streamProgress?: boolean };

    if (wantsProgressStream(body)) {
      return createNdjsonProgressStreamResponse(
        (report) => runBakeStartFrame(body, report),
        (result) => result.status === 'error',
        { errorStatus: 400 },
      );
    }

    const result = await runBakeStartFrame(body, () => {});
    return NextResponse.json(result, { status: result.status === 'error' ? 400 : 200 });
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