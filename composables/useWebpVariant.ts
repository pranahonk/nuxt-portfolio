// Pick the closest generated WebP variant for a local asset path.
// Works by indexing generated files that follow `<name>-<width>.webp` next to the originals under `assets/image/Portfolio/`.
// If no variant is found, falls back to the original src.

const variantEntries = import.meta.glob(
  '@/assets/image/Portfolio/**/*-*.webp',
  { eager: true }
) as Record<string, any>;

// Build an index: base path (without -<w>.webp) -> [{ width, url }]
const variantIndex = new Map<string, { width: number; url: string }[]>();

for (const [key, mod] of Object.entries(variantEntries)) {
  const match = key.match(/-(\d+)\.webp$/);
  if (!match) continue;
  const width = Number(match[1]);
  const base = key.replace(/-(\d+)\.webp$/, '');
  // Vite module default export is the URL for assets
  const url = (mod && (mod.default || mod)) as string;
  const arr = variantIndex.get(base) || [];
  arr.push({ width, url });
  variantIndex.set(base, arr);
}

for (const [k, arr] of variantIndex) {
  arr.sort((a, b) => a.width - b.width);
  variantIndex.set(k, arr);
}

export function useWebpVariant() {
  function resolveVariant(src: string, targetWidth = 1280): string {
    // Normalize incoming src to an alias path like '@/assets/...'
    // Accept forms starting with '~/' or '@/'
    let normalized = src
      .replace(/^~\//, '@/')
      .replace(/^\//, '@/'); // if someone passes '/assets/...'

    // Remove file extension if it's .jpg/.jpeg/.png/.webp in the "base" key matching
    const baseKey = normalized.replace(/\.(jpe?g|png|webp)$/i, '');

    const candidates = variantIndex.get(baseKey);
    if (!candidates || candidates.length === 0) {
      return src; // fallback to original
    }
    // Find the smallest candidate that is >= targetWidth, else the largest available
    let chosen = candidates[candidates.length - 1];
    for (const c of candidates) {
      if (c.width >= targetWidth) {
        chosen = c; break;
      }
    }
    return chosen.url || src;
  }

  return { resolveVariant };
}
