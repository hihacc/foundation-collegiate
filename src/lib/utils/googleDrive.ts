/**
 * Utility helper to parse and convert Google Drive shareable URLs into 
 * direct image view URLs and direct download URLs.
 */

export function parseGoogleDriveId(url: string): string | null {
  if (!url) return null;

  // Match /file/d/FILE_ID
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Match id=FILE_ID
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  // Match /d/FILE_ID
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  return null;
}

export function formatGoogleDriveImageUrl(url: string): string {
  if (!url) return '';
  const fileId = parseGoogleDriveId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

export function formatGoogleDriveDownloadUrl(url: string): string {
  if (!url) return '';
  const fileId = parseGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}
