import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { createDomTranslator } from '../lib/domTranslate';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// Mounts once inside the public app and keeps the DOM in sync with the selected
// language. A MutationObserver re-applies translations when React renders new
// content (route changes, dialogs, data loading), so no component needs to know
// about the language at all.
export default function LanguageTranslator() {
  const { language } = useApp();
  const translatorRef = useRef(null);

  useEffect(() => {
    const translator = createDomTranslator(document.body);
    translatorRef.current = translator;

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        translator.run();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const translator = translatorRef.current;
    if (!translator) return;
    translator.setLanguage(language);
    translator.run();
  }, [language]);

  return null;
}
