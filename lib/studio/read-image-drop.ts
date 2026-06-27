function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface ReadImageResult {
  url: string;
  label?: string;
}

export async function readImageFromFile(file: File | undefined): Promise<ReadImageResult | null> {
  if (!file?.type.startsWith('image/')) return null;
  const url = await readFileAsDataUrl(file);
  const label = file.name.replace(/\.[^/.]+$/, '').trim() || undefined;
  return { url, label };
}

export async function readImageFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<ReadImageResult | null> {
  const file = dataTransfer.files[0];
  if (file?.type.startsWith('image/')) {
    return readImageFromFile(file);
  }
  const uri = dataTransfer
    .getData('text/uri-list')
    .split('\n')
    .find((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    });
  if (uri && (uri.startsWith('data:image/') || uri.startsWith('blob:') || /^https?:\/\//.test(uri))) {
    return { url: uri };
  }
  return null;
}

export function isImageDrag(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types);
  return (
    types.includes('Files') ||
    types.includes('text/uri-list') ||
    types.includes('text/html') ||
    types.includes('application/x-moz-file')
  );
}
