document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.navbar-nav');

  nav.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '0'));

  nav.addEventListener('keydown', (e) => {
    const links = Array.from(nav.querySelectorAll('a')).filter(el => el.offsetParent !== null);
    const current = document.activeElement;
    const currentIndex = links.indexOf(current);
    if (currentIndex === -1) return;

    const moveFocus = (index) => {
      if (index >= 0 && index < links.length) {
        links[index].focus();
      }
    };

    const isTopLevel = current.closest('.dropdown-menu') === null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();

      // Move right within top-level menu
      if (isTopLevel) {
        let next = current.closest('li')?.nextElementSibling;
        while (next && !next.querySelector('a')) next = next.nextElementSibling;
        if (next) next.querySelector('a').focus();
      } else {
        // Inside submenu – open submenu if present
        const submenu = current.nextElementSibling;
        if (submenu && submenu.classList.contains('dropdown-menu')) {
          submenu.style.display = 'block';
          current.setAttribute('aria-expanded', 'true');
          const first = submenu.querySelector('a');
          if (first) first.focus();
        }
      }
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();

      // Move left within top-level menu
      if (isTopLevel) {
        let prev = current.closest('li')?.previousElementSibling;
        while (prev && !prev.querySelector('a')) prev = prev.previousElementSibling;
        if (prev) prev.querySelector('a').focus();
      } else {
        // Inside submenu – go back to parent toggle
        const parentMenu = current.closest('.dropdown-menu');
        if (parentMenu) {
          const parentToggle = parentMenu.parentElement.querySelector('.dropdown-toggle');
          if (parentToggle) {
            parentMenu.style.display = 'none';
            parentToggle.setAttribute('aria-expanded', 'false');
            parentToggle.focus();
          }
        }
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus((currentIndex + 1) % links.length);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus((currentIndex - 1 + links.length) % links.length);
    }

    if (e.key === 'Escape') {
      const parentMenu = current.closest('.dropdown-menu');
      if (parentMenu) {
        const parentToggle = parentMenu.parentElement.querySelector('.dropdown-toggle');
        if (parentToggle) {
          parentMenu.style.display = 'none';
          parentToggle.setAttribute('aria-expanded', 'false');
          parentToggle.focus();
        }
      }
    }
  });

  // Hide submenu on blur
  document.querySelectorAll('.dropdown-submenu > .dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('blur', () => {
      setTimeout(() => {
        const submenu = toggle.nextElementSibling;
        if (submenu && !submenu.contains(document.activeElement)) {
          submenu.style.display = 'none';
          toggle.setAttribute('aria-expanded', 'false');
        }
      }, 200);
    });
  });
});
