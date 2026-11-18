// -----------------------------------------------------------------------------
// DOM text translator.
//
// The public site mixes hard-coded UI copy with database content. To switch the
// interface between English and Indonesian without touching every component,
// this module walks the rendered DOM and replaces any text node (and a small set
// of user-visible attributes) whose English value exists in the i18n dictionary.
//
// It remembers the original English value for every node so switching back to
// English is lossless, and it tolerates React re-renders: when React writes new
// English text into a node it is treated as a fresh source and re-translated.
// -----------------------------------------------------------------------------

import { createTranslator } from './i18n';

// Elements whose contents must never be translated.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

// Attributes that contain user-visible copy.
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// Translation state lives at module scope so a React remount (StrictMode, HMR)
// does not lose the original English source text.
const textState = new WeakMap(); // Text node -> { source, applied }
const attrState = new WeakMap(); // Element -> { [attr]: { source, applied } }

export function createDomTranslator(root) {
  let translate = (text) => text;

  function applyTextNode(node) {
    const current = node.nodeValue;
    if (current == null || !current.trim()) return;

    let state = textState.get(node);
    if (!state || current !== state.applied) {
      state = { source: current, applied: current };
      textState.set(node, state);
    }

    const next = translate(state.source);
    if (next !== current) node.nodeValue = next;
    state.applied = next;
  }

  function applyAttributes(element) {
    let map = attrState.get(element);
    ATTRS.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;
      const current = element.getAttribute(attr);
      if (current == null || !current.trim()) return;
      if (!map) {
        map = {};
        attrState.set(element, map);
      }
      let state = map[attr];
      if (!state || current !== state.applied) {
        state = { source: current, applied: current };
        map[attr] = state;
      }
      const next = translate(state.source);
      if (next !== current) element.setAttribute(attr, next);
      state.applied = next;
    });
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      applyTextNode(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;
    // Opt-out marker for controls that must keep their literal label.
    if (node.hasAttribute('data-no-translate')) return;

    applyAttributes(node);
    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child);
    }
  }

  return {
    setLanguage(lang) {
      translate = createTranslator(lang);
    },
    run() {
      walk(root);
    },
  };
}
