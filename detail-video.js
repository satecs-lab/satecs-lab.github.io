(() => {
  const video = document.querySelector('.detail-video video');
  if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  video.muted = true;
  const timer = window.setTimeout(() => {
    if (video.paused) video.play().catch(() => {});
  }, 1000);

  window.addEventListener('pagehide', () => {
    window.clearTimeout(timer);
    video.pause();
  }, { once: true });
})();
