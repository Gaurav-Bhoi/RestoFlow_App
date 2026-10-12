import BootSplash from 'react-native-bootsplash';

export async function initializeApplication(
  restore: () => Promise<void>,
  recover: () => void | Promise<void>,
) {
  try {
    await restore();
  } catch {
    try {
      await recover();
    } catch {
      // Local readiness still proceeds when the fallback itself cannot restore.
    }
  }
}

export async function hideStartupSplash() {
  try {
    await BootSplash.hide({ fade: true });
  } catch {
    // Retry without animation if the transition failed. Never use a splash timer.
    await BootSplash.hide({ fade: false }).catch(() => undefined);
  }
}
