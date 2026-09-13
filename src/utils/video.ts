// Porté depuis EkvaraFrontend (ExerciseDetailModal.tsx, ticket #5 §12) :
// n'affiche un lecteur que pour les formats explicitement supportés
// (YouTube, Vimeo) — pas d'infrastructure vidéo, pas d'iframe générique
// pointant vers une origine arbitraire.
export function getVideoEmbedUrl(videoUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.split('/').pop();
    if (url.pathname.startsWith('/embed/')) return url.toString();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === 'youtu.be') {
    const videoId = url.pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === 'vimeo.com') {
    const videoId = url.pathname.slice(1);
    return /^\d+$/.test(videoId) ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  if (host === 'player.vimeo.com') {
    return url.toString();
  }

  return null;
}
