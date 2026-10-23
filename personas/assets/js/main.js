
(function() {
  "use strict";

  /**
   * Back to top button
   */
  const backtotop = document.querySelector('.back-to-top');

  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active');
      } else {
        backtotop.classList.remove('active');
      }
    };

    window.addEventListener('load', toggleBacktotop);
    window.addEventListener('scroll', toggleBacktotop);
  }

  /**
   * Dynamic footer date
   */
  const updateFooterDate = () => {
    const lastUpdated = document.getElementById('lastUpdated');

    if (!lastUpdated) return;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    lastUpdated.textContent = `${day}.${month}.${year}`;
    lastUpdated.setAttribute(
      'datetime',
      `${year}-${month}-${day}`
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFooterDate);
  } else {
    updateFooterDate();
  }

})();
