import type { GeneratedVideo, Shot } from '@/lib/types/studio';

export function getShotGeneratedVideos(shot: Shot | undefined): GeneratedVideo[] {
  return shot?.generatedVideos ?? [];
}

export function getGeneratedVideoCount(shot: Shot | undefined): number {
  return getShotGeneratedVideos(shot).length;
}

export function getActiveVideoIndex(shot: Shot | undefined): number {
  if (!shot) return 0;
  const videos = getShotGeneratedVideos(shot);
  if (!videos.length) return 0;
  const idx = shot.activeVideoIndex ?? videos.length - 1;
  return Math.min(Math.max(0, idx), videos.length - 1);
}

export function getActiveGeneratedVideo(shot: Shot | undefined): GeneratedVideo | null {
  const videos = getShotGeneratedVideos(shot);
  if (!videos.length) return null;
  return videos[getActiveVideoIndex(shot)] ?? null;
}

export function getShotActiveVideoUrl(shot: Shot | undefined): string | null {
  return getActiveGeneratedVideo(shot)?.url ?? shot?.videoUrl ?? null;
}

export function migrateShotGeneratedVideos(
  shot: Shot,
): Pick<Shot, 'generatedVideos' | 'activeVideoIndex' | 'videoUrl'> {
  if (shot.generatedVideos?.length) {
    const idx = getActiveVideoIndex(shot);
    const active = shot.generatedVideos[idx];
    return {
      generatedVideos: shot.generatedVideos,
      activeVideoIndex: idx,
      videoUrl: active?.url ?? shot.videoUrl ?? null,
    };
  }

  if (shot.videoUrl) {
    const legacy: GeneratedVideo = {
      id: `legacy-${shot.id}`,
      url: shot.videoUrl,
      posterUrl: shot.thumbnail,
      createdAt: 0,
    };
    return {
      generatedVideos: [legacy],
      activeVideoIndex: 0,
      videoUrl: shot.videoUrl,
    };
  }

  return {
    generatedVideos: [],
    activeVideoIndex: 0,
    videoUrl: null,
  };
}

function newVideoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function appendGeneratedVideo(
  shot: Shot,
  entry: { url: string; posterUrl?: string | null; providerJobId?: string },
): Partial<Shot> {
  const videos = [...getShotGeneratedVideos(shot)];
  const newVideo: GeneratedVideo = {
    id: newVideoId(),
    url: entry.url,
    posterUrl: entry.posterUrl ?? null,
    createdAt: Date.now(),
    providerJobId: entry.providerJobId,
  };
  videos.push(newVideo);
  const activeVideoIndex = videos.length - 1;
  return {
    generatedVideos: videos,
    activeVideoIndex,
    videoUrl: newVideo.url,
    thumbnail: newVideo.posterUrl ?? shot.thumbnail,
  };
}

export function selectGeneratedVideoIndex(shot: Shot, index: number): Partial<Shot> {
  const videos = getShotGeneratedVideos(shot);
  if (!videos.length) return {};
  const activeVideoIndex = Math.min(Math.max(0, index), videos.length - 1);
  const active = videos[activeVideoIndex];
  return {
    activeVideoIndex,
    videoUrl: active.url,
    thumbnail: active.posterUrl ?? shot.thumbnail,
  };
}

export function linkGeneratedVideoMediaAsset(
  shot: Shot,
  videoId: string,
  mediaLibraryAssetId: string,
  persistedUrl?: string,
): Partial<Shot> {
  const videos = getShotGeneratedVideos(shot);
  const index = videos.findIndex((video) => video.id === videoId);
  if (index < 0) return {};

  const nextVideos = videos.map((video) => (
    video.id === videoId
      ? {
          ...video,
          mediaLibraryAssetId,
          ...(persistedUrl ? { url: persistedUrl } : {}),
        }
      : video
  ));

  const activeIndex = getActiveVideoIndex(shot);
  const patch: Partial<Shot> = { generatedVideos: nextVideos };
  if (videos[activeIndex]?.id === videoId && persistedUrl) {
    patch.videoUrl = persistedUrl;
  }
  return patch;
}

export function deleteGeneratedVideoById(shot: Shot, id: string): Partial<Shot> {
  const videos = getShotGeneratedVideos(shot);
  const removeIdx = videos.findIndex((v) => v.id === id);
  if (removeIdx < 0) return {};

  const nextVideos = videos.filter((v) => v.id !== id);
  if (!nextVideos.length) {
    return {
      generatedVideos: [],
      activeVideoIndex: 0,
      videoUrl: null,
    };
  }

  const prevActive = getActiveVideoIndex(shot);
  let activeVideoIndex = prevActive;
  if (removeIdx < prevActive) activeVideoIndex = prevActive - 1;
  else if (removeIdx === prevActive) activeVideoIndex = Math.min(prevActive, nextVideos.length - 1);

  const active = nextVideos[activeVideoIndex];
  return {
    generatedVideos: nextVideos,
    activeVideoIndex,
    videoUrl: active.url,
    thumbnail: active.posterUrl ?? shot.thumbnail,
  };
}