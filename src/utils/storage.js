// localStorage access throws SecurityError when storage is blocked (e.g.
// "Block all cookies", some embedded webviews); degrade silently instead of
// taking the whole app down during the first render.
export const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage blocked — onboarding repeats and resume is lost, nothing else.
    }
  },
}
