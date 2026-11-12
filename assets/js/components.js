(function () {
  'use strict';

  const EXTERNAL_SCRIPTS = [
      'https://translation-plugin.bhashini.co.in/v4/website_translation_utility.js'
  ];

  // English + India's 22 Scheduled Languages (one list, used everywhere)
  const LANGUAGE_CODES =
      'en,as,bn,brx,doi,gu,hi,kn,ks,gom,mai,ml,mni,mr,ne,or,pa,sa,sat,sd,ta,te,ur';

  async function loadInclude(el) {
      const url = el.getAttribute('data-include');
      if (!url) return;

      try {
          const response = await fetch(url);

          if (!response.ok) {
              throw new Error(
                  response.status + ' ' + response.statusText
              );
          }

          const html = await response.text();

          // Replace the placeholder with the loaded markup
          el.outerHTML = html;
      } catch (err) {
          console.error('Could not load "' + url + '":', err);
          el.innerHTML = '<!-- failed to load ' + url + ' -->';
      }
  }

  function loadScript(src) {
      return new Promise(function (resolve, reject) {

          // Don't load the same script twice
          const existingScript = document.querySelector(
              'script[src="' + src + '"]'
          );

          if (existingScript) {
              // Apply language configuration to an existing script
              existingScript.setAttribute('translation-language-list', LANGUAGE_CODES);
              existingScript.setAttribute('language_order', LANGUAGE_CODES);
              resolve();
              return;
          }

          const s = document.createElement('script');

          s.src = src;
          s.setAttribute('translation-language-list', LANGUAGE_CODES);
          s.setAttribute('language_order', LANGUAGE_CODES);

          s.onload = resolve;

          s.onerror = function () {
              reject(
                  new Error('Failed to load script: ' + src)
              );
          };

          document.body.appendChild(s);
      });
  }

  /* ---------------------------------------------------------
     Accessibility: label the Bhashini form fields
     WAVE reports "Missing form label" because the plugin
     injects its <select>/<input> without a label. Each field
     gets a visually hidden <label for="..."> as soon as it
     appears, and again if the plugin rebuilds it.
     --------------------------------------------------------- */
  /* The plugin often puts its dropdown and search box at the end of
     <body>, not inside .bhashini-plugin-container, so the whole page
     is checked. Any field with no label gets an aria-label (WAVE
     accepts it, and the plugin can't wipe it out by re-rendering a
     sibling <label>). */
  const FIELD_SELECTOR =
      'select, textarea, input:not([type="hidden"]):not([type="submit"])' +
      ':not([type="button"]):not([type="reset"]):not([type="image"])';

  function hasLabel(field) {
      if ((field.getAttribute('aria-label') || '').trim()) return true;
      if (field.hasAttribute('aria-labelledby')) return true;
      if (field.closest('label')) return true;
      if (field.id &&
          document.querySelector('label[for="' + CSS.escape(field.id) + '"]')) return true;
      return false;
  }

  // True if the field belongs to the Bhashini / translation plugin
  function isBhashiniField(field) {
      let el = field;
      while (el && el !== document.body) {
          const idClass = ((el.id || '') + ' ' +
              (typeof el.className === 'string' ? el.className : '')).toLowerCase();
          if (idClass.indexOf('bhashini') !== -1 ||
              idClass.indexOf('translat') !== -1 ||
              idClass.indexOf('lang') !== -1) return true;
          el = el.parentElement;
      }
      return false;
  }

  // Known unlabelled fields in the Bhashini v4 feedback modal
  // (appended to <body> as .bhashini-feedback-modal)
  const BHASHINI_KNOWN_LABELS = [
      { selector: '.feedback-textarea',            text: 'Describe your issue' },
      { selector: '.feedback-suggested-feedback',  text: 'Suggested translation' }
  ];

  function labelFor(field) {
      for (const item of BHASHINI_KNOWN_LABELS) {
          if (field.matches(item.selector)) return item.text;
      }
      if (isBhashiniField(field)) {
          return field.tagName === 'SELECT' ? 'Select language' : 'Search language';
      }
      // Any other unlabelled field: use its own hint text if it has one
      return (field.getAttribute('placeholder') ||
              field.getAttribute('title') ||
              field.getAttribute('name') ||
              'Input field').trim();
  }

  function labelBhashiniFields() {
      document.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
          if (hasLabel(field)) return;
          const text = labelFor(field);
          field.setAttribute('aria-label', text);
          if (!field.getAttribute('title')) field.setAttribute('title', text);
      });
  }

  function watchBhashini() {
      labelBhashiniFields();

      // The plugin builds its markup after it loads; watch for it.
      let queued = false;
      const observer = new MutationObserver(function () {
          if (queued) return;
          queued = true;
          requestAnimationFrame(function () {
              queued = false;
              labelBhashiniFields();
          });
      });

      observer.observe(document.body, { childList: true, subtree: true });
  }

  async function loadAll() {
      const placeholders = document.querySelectorAll('[data-include]');

      await Promise.all(
          Array.from(placeholders).map(loadInclude)
      );

      // Let other scripts know the header/footer now exist
      document.dispatchEvent(
          new CustomEvent('components:loaded')
      );

      // Header (with the Bhashini container) exists now: start watching
      watchBhashini();

      // Load Bhashini after the components are ready
      for (const src of EXTERNAL_SCRIPTS) {
          try {
              await loadScript(src);
          } catch (err) {
              console.error(err);
          }
      }

      // Label once more after the plugin script has run
      labelBhashiniFields();
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAll);
  } else {
      loadAll();
  }
})();
