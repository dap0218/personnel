(function () {
    'use strict';
  
    const EXTERNAL_SCRIPTS = [
      'https://translation-plugin.bhashini.co.in/v4/website_translation_utility.js'
    ];
  
    async function loadInclude(el) {
      const url = el.getAttribute('data-include');
      if (!url) return;
  
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(response.status + ' ' + response.statusText);
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
        if (document.querySelector('script[src="' + src + '"]')) {
          resolve();
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = function () {
          reject(new Error('Failed to load script: ' + src));
        };
        document.body.appendChild(s);
      });
    }
  
    async function loadAll() {
      const placeholders = document.querySelectorAll('[data-include]');
      await Promise.all(Array.from(placeholders).map(loadInclude));
  
      // Let other scripts know the header/footer now exist in the DOM
      document.dispatchEvent(new CustomEvent('components:loaded'));
  
      // Load external scripts that need the header to exist first
      for (const src of EXTERNAL_SCRIPTS) {
        try {
          await loadScript(src);
        } catch (err) {
          console.error(err);
        }
      }
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAll);
    } else {
      loadAll();
    }
  })();