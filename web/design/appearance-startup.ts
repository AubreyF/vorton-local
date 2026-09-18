import {APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE_ID, getAppearanceAttributes, resolveAppearanceId} from './theme-registry';
import {applyInterfaceZoomToDocument} from './interface-zoom-client';

// Retain the existing origin-wide preference. Migrate the former demo-only key
// only when no shared preference has ever been chosen.
export function initializeAppearance() {
  let appearance: string = DEFAULT_APPEARANCE_ID;
  try {
    appearance = localStorage.getItem(APPEARANCE_STORAGE_KEY) || localStorage.getItem('vorton-demo-appearance') || DEFAULT_APPEARANCE_ID;
    localStorage.setItem(APPEARANCE_STORAGE_KEY,resolveAppearanceId(appearance));
    localStorage.removeItem('vorton-demo-appearance');
  } catch { /* Storage is optional. */ }
  Object.assign(document.documentElement.dataset,getAppearanceAttributes(resolveAppearanceId(appearance)));
  applyInterfaceZoomToDocument();
}
