// Shared scroll lock utility with reference counting.
// Prevents bugs when multiple overlays (e.g. link modal inside fullscreen) are open simultaneously.
let activeCount = 0;

export const lockBodyScroll = () => {
  activeCount += 1;
  if (activeCount === 1) {
    document.body.style.overflow = "hidden";
  }
};

export const unlockBodyScroll = () => {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    document.body.style.overflow = "";
  }
};
