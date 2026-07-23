import { nextTick } from "vue";

// Cross-panel focus bridges. The Atelier's keyboard flow hops between the
// hierarchy tree and the Properties panel, which live in sibling components
// with no shared ref — so the hop goes through the DOM. Keeping the selectors
// here means the two panels agree on them in one place.

// `data-panel` rather than the panel's class, because that class is derived
// from its display heading — renaming the heading would silently break the hop.
const PROPERTIES = '[data-panel="properties"]';

export function focusProperties() {
  // Focus the panel itself, not its first component — landing on a header would
  // light that component up (`focus-within`) as though it were picked. From the
  // container, Tab and the arrow keys still walk the components from the top.
  //
  // Deferred: selecting a node re-renders the panel, so it is not there to
  // receive focus until after the next patch.
  nextTick(() => {
    document.querySelector<HTMLElement>(`${PROPERTIES} .view`)?.focus();
  });
}

