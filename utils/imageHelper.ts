/**
 * Helper function to get optimized image path with WebP-first approach
 * Falls back to JPEG/PNG if WebP is not available
 */
export function getOptimizedImagePath(imageName: string): string {
  const basePath = '/images/portfolio'
  const nameWithoutExtension = imageName.replace(/\.(png|jpg|jpeg)$/i, '')

  // Return WebP first, with fallback handled by browser/Nuxt Image
  return `${basePath}/${nameWithoutExtension}.webp`
}

/**
 * Get fallback image path for non-WebP formats
 */
export function getFallbackImagePath(imageName: string): string {
  const basePath = '/images/portfolio'
  return `${basePath}/${imageName}`
}

/**
 * Generate srcSet for responsive images with WebP and fallback formats
 */
export function generateImageSrcSet(imageName: string): { webp: string; fallback: string } {
  return {
    webp: getOptimizedImagePath(imageName),
    fallback: getFallbackImagePath(imageName)
  }
}
