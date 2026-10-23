/*
* UX4G v1.0.0 (https://doc.ux4g.gov.in/)
* Copyright 2024 The UX4G Authors
* Copyright 2024 NeGD, MeitY.
* Licensed under MIT. 
 */

// Early panel trigger delegation: register before legacy feature handlers so an unrelated
// missing control cannot prevent the accessibility panel trigger from being wired.
(function () {
  if (document.documentElement.dataset.ux4gEarlyPanelHandler === 'true') return;
  document.documentElement.dataset.ux4gEarlyPanelHandler = 'true';
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var trigger = target.closest('#uw-widget-custom-trigger, #uw-widget-custom-trigger2, .uw-widget-custom-trigger');
    if (!trigger) return;
    event.preventDefault();
    var panel = document.getElementById('uw-main');
    if (!panel) {
      console.error('UX4G: Accessibility panel #uw-main was not found.');
      return;
    }
    panel.classList.remove('uwaw-initial');
    panel.classList.add('is-open', 'accessibility-panel-open');
    panel.style.setProperty('display', 'block', 'important');
    panel.style.setProperty('visibility', 'visible', 'important');
    panel.style.setProperty('opacity', '1', 'important');
    panel.style.setProperty('position', 'fixed', 'important');
    panel.style.setProperty('right', '0', 'important');
    panel.style.setProperty('left', 'auto', 'important');
    panel.style.setProperty('top', '0', 'important');
    panel.style.setProperty('width', 'min(490px, 100vw)', 'important');
    panel.style.setProperty('height', '100vh', 'important');
    panel.style.setProperty('max-height', '100vh', 'important');
    panel.style.setProperty('overflow-y', 'auto', 'important');
    panel.style.setProperty('z-index', '2147483647', 'important');
    panel.style.setProperty('transform', 'none', 'important');
    panel.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('#uw-widget-custom-trigger, #uw-widget-custom-trigger2, .uw-widget-custom-trigger').forEach(function (button) {
      button.setAttribute('aria-controls', 'uw-main');
      button.setAttribute('aria-expanded', 'true');
    });
  });
})();

// Exclude Widgets text, links, Images on widgets click

function isExcludedElement(element) {
    // Check if the element is inside #uw-main or has class .uwaw-features__item__name
    if (
          element.closest('#uw-main') ||
          element.classList.contains('uwaw-features__item__name') ||
          element.classList.contains('ux4g-text-spacing') ||
          element.classList.contains('feature-image') ||
          element.classList.contains('icon_global') ||
          element.classList.contains('copyright-text') ||
          element.classList.contains('ux4g-copy')
        ) {
            return true;
        }
    
        // Exclude script and svg elements
        if (element.tagName === 'SCRIPT' || element.tagName === 'DIV' || element.tagName === 'LINK'
       || element.tagName === 'HTML'
       || element.tagName === 'HEAD'
       || element.tagName === 'BODY'
        || (element.tagName === 'svg' && element.namespaceURI === 'http://www.w3.org/2000/svg')) {
            return true;
        }
    
        return false;
    }
    
    
    /***************************************************************************************************/
  
  
  // ******************************************************************************* //
  
  // Bigger & Smaller text script
  
  function handleFontSizes(btnId, featureItemId, featureStepsId, tickIconId, increase, btn) {
    var Storageclick = btn + '-clickCount';
    var ButtonStorageClick = btn + '-buttonClicked';
    var SizeStorage = btn + '-size';
    var clickCount = parseInt(localStorage.getItem(Storageclick) || '0', 10) || 0;
    // Restore the cumulative size change after a page reload.
    var addsize = parseFloat(localStorage.getItem(SizeStorage) || '0') || 0;

    // Reset in-memory counters when Reset All is pressed.
    document.addEventListener('ux4g:reset', function () {
      clickCount = 0;
      addsize = 0;
    });
  
    document.addEventListener('DOMContentLoaded', function() { 
  
      var featureItem = document.getElementById(featureItemId);
      var featureSteps = document.getElementById(featureStepsId);
      var tickIcon = document.getElementById(tickIconId);
  
      // Get Storage Items
      var FontSizeBtnState = JSON.parse(localStorage.getItem(ButtonStorageClick));
      var FontSizeClickState = JSON.parse(localStorage.getItem(Storageclick));
      // var FontSizeState = localStorage.getItem(SizeStorage);
      var FontSizeStateBigger = localStorage.getItem('bt-size');
      var FontSizeStateSmaller = localStorage.getItem('st-size');
  
  
      if (FontSizeBtnState) {
  
        featureItem.classList.add('feature-active');
        featureSteps.classList.add('featureSteps-visible');
        tickIcon.style.display = 'inline-block';
  
        // Add step span tags dynamically
        var StoragestepsHTML = '';
        for (var i = 0; i < 4; i++) {
          StoragestepsHTML += '<span class="' + (i < FontSizeClickState ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
        }
        featureSteps.innerHTML = StoragestepsHTML;
  
        if (FontSizeStateBigger !== null && parseFloat(FontSizeStateBigger) !== 0) {
          document.getElementById('btn-small-text').disabled = true;
          var elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)');
          elements.forEach(function(element) {
          // Exclude elements inside #uw-main and with class .uwaw-features__item__name
          if (!isExcludedElement(element)) {
          var currentSize = window.getComputedStyle(element).fontSize;
          var newSize =  parseFloat(currentSize) + parseFloat(FontSizeStateBigger);
          element.style.setProperty('font-size', newSize + 'px', 'important');
  
  
          } 
        });
  
      }
  
          if (FontSizeStateSmaller !== null && parseFloat(FontSizeStateSmaller) !== 0) {
            document.getElementById('btn-s9').disabled = true;
            var elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)');
            elements.forEach(function(element) {
            // Exclude elements inside #uw-main and with class .uwaw-features__item__name
            if (!isExcludedElement(element)) {
            var currentSize = window.getComputedStyle(element).fontSize;
            var newSize =  parseFloat(currentSize) - parseFloat(FontSizeStateSmaller);
            element.style.setProperty('font-size', newSize + 'px', 'important');
  
    
          } 
        });
      }
        }
    
    });
  
  document.addEventListener('click', function(event) {
  if (!event.target || !event.target.closest || !event.target.closest('#' + btnId)) return;
  clickCount++;
  addsize += 2;
  var featureItem = document.getElementById(featureItemId);
  var featureSteps = document.getElementById(featureStepsId);
  var tickIcon = document.getElementById(tickIconId);
  
  if (btnId == "btn-s9") {document.getElementById('btn-small-text').disabled = true; localStorage.setItem('btn-big', true);}
  
  if (btnId == "btn-small-text") {document.getElementById('btn-s9').disabled = true; localStorage.setItem('btn-small', true);}
  
  // Save current state to local storage
  localStorage.setItem(Storageclick, clickCount);
  localStorage.setItem(ButtonStorageClick, true);
  
  
  // Reset on 5th click
  if (clickCount === 5) {
  clickCount = 0;
  addsize = 0;
  featureItem.classList.remove('feature-active');
  featureSteps.classList.remove('featureSteps-visible');
  featureSteps.innerHTML = '';
  tickIcon.style.display = 'none';
  localStorage.setItem(Storageclick, 0);
  localStorage.setItem(ButtonStorageClick, false);
  
  if (btnId == "btn-s9") {
    var smallerButton = document.getElementById('btn-small-text');
    if (smallerButton) smallerButton.disabled = false;
    localStorage.setItem('btn-big', false);
  }
  if (btnId == "btn-small-text") {
    var biggerButton = document.getElementById('btn-s9');
    if (biggerButton) biggerButton.disabled = false;
    localStorage.setItem('btn-small', false);
  }
  
  // Reset font size of all elements
  resetFontSizes(btn, Storageclick, ButtonStorageClick);
  return;
  }
  // Add feature-active class on the first click
  if (clickCount === 1) {
      featureItem.classList.add('feature-active');
      featureSteps.classList.add('featureSteps-visible');
      localStorage.setItem(Storageclick, clickCount);
      localStorage.setItem(ButtonStorageClick, true);
  }
  
  // Update data-uw-reader-content attribute
  document.getElementById(btnId).setAttribute('data-uw-reader-content', clickCount);
  
  // Add step span tags dynamically
  var stepsHTML = '';
  for (var i = 0; i < 4; i++) {
    stepsHTML += '<span class="' + (i < clickCount ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
  }
  featureSteps.innerHTML = stepsHTML;
  
  // Display tick icon until the 4th click
  if (clickCount < 5) {
   tickIcon.style.display = 'inline-block';
  }
  
  adjustFontSizes(increase, btn, addsize);
      });
  }
  
  function adjustFontSizes(increase, btn, addsize) {
  var SizeStorage = btn + '-size';
  var elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)');
  elements.forEach(function(element) {
  // Exclude elements inside #uw-main and with class .uwaw-features__item__name
  if (!isExcludedElement(element)) {
  var currentSize = window.getComputedStyle(element).fontSize;
  var newSize = increase ? parseFloat(currentSize) + 2 : parseFloat(currentSize) - 2;
  // element.style.fontSize = newSize + 'px';
  element.style.setProperty('font-size', newSize + 'px', 'important');
  localStorage.setItem(SizeStorage, parseFloat(addsize));
          }
      });
  }
  
  // Reset font sizes
  function resetFontSizes() {
      var elements = document.querySelectorAll('*');
      elements.forEach(function(element) {
      // Reset font-size style for all elements
      element.style.fontSize = '';
      localStorage.setItem('st-size', 0);
      localStorage.setItem('st-clickCount', 0);
      localStorage.setItem('st-buttonClicked', false);
      localStorage.setItem('bt-size', 0);
      localStorage.setItem('bt-clickCount', 0);
      localStorage.setItem('bt-buttonClicked', false);
      localStorage.setItem('btn-big', false);
      localStorage.setItem('btn-small', false);
      });
  }
  
  
  // Usage
  // The old per-element font changer is switched off: it looked for IDs that are not in the footer
  // ('featureItem', 'featureSteps', 'tickIcon'), so Text Size Increase crashed and left Text Size
  // Decrease disabled. Text size is now handled by the "Text size" block further down.
  // handleFontSizes('btn-s9', 'featureItem', 'featureSteps', 'tickIcon', true, 'bt');
  // handleFontSizes('btn-small-text', 'featureItem-st', 'featureSteps-st', 'tickIcon-st', false, 'st');
  
  // document.getElementById(btn-s9).addEventListener('click', function() { 
  
  
  
  // });
  
  // ******************************************************************************* //
  
  // text spacing 
  
  
  
  let letterSpacing = 0; // Initial letter spacing (auto)
  let clickCountText = 0; // Counter to track button clicks
  
  // Check local storage for previous state
  var localStorageSpacingCount = localStorage.getItem('ts-clickCount');
  if (localStorageSpacingCount) {
    clickCountText = parseInt(localStorageSpacingCount, 10);
  }
  
  
  function increaseAndReset() {
    clickCountText++;
  var featureItem_ts = document.getElementById('featureItem-ts');
  var featureSteps_ts = document.getElementById('featureSteps-ts');
  var tickIcon_ts = document.getElementById('tickIcon-ts');
  
  // Save current state to local storage
  localStorage.setItem('ts-clickCount', clickCountText);
  localStorage.setItem('ts-buttonClicked',true);
    
  // Reset letter spacing after the third click
  if (clickCountText === 4) {
  letterSpacing = 0; // Reset letter spacing to auto (0)
  clickCountText = 0; // Reset click count
  featureItem_ts.classList.remove('feature-active');
  featureSteps_ts.classList.remove('featureSteps-visible');
  featureSteps_ts.innerHTML = '';
  tickIcon_ts.style.display = 'none';
  
  // Save current state to local storage
  localStorage.setItem('ts-clickCount', clickCountText);
  localStorage.setItem('ts-buttonClicked',false);
  
  // Reset font size of all elements
  resetLetterspacing();
  return;
  }
  
  // Add feature-active class on the first click
  if (clickCountText === 1) {
    featureItem_ts.classList.add('feature-active');
    featureSteps_ts.classList.add('featureSteps-visible');
  
    // Save current state to local storage
    localStorage.setItem('ts-clickCount', clickCountText);
    localStorage.setItem('ts-buttonClicked',true);
    }
              
  // Add step span tags dynamically
  var stepsHTML_ts = '';
    for (var i = 0; i < 3; i++) {
    stepsHTML_ts += '<span class="' + (i < clickCountText ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
    }
    featureSteps_ts.innerHTML = stepsHTML_ts;
  // Display tick icon until the 4th click
  if (clickCountText < 4) {
    tickIcon_ts.style.display = 'inline-block';
  }
  
  letterSpacing += 2; // Increase by 5px
    applyLetterSpacing();
  }
  
  function decreaseSpacing() {
    letterSpacing -= 5; // Decrease by 5px
    applyLetterSpacing();
    }
  
  function applyLetterSpacing() {
  const elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)'); // Select all elements except buttons
    elements.forEach(function(element) {
    if (!isExcludedElement(element)) {
  
          var currentSize_ts = parseFloat(window.getComputedStyle(element).letterSpacing);
          currentSize_ts = isNaN(currentSize_ts) ? 0 : currentSize_ts; // Handle cases where lineHeight is 'normal' or an invalid value
  
          // Convert to pixels (optional, depending on your needs)
          currentSize_ts = currentSize_ts + 'px';
          var newSize_ts = parseFloat(currentSize_ts) + 2;
          // element.style.letterSpacing = newSize_ts;
          element.style.setProperty('letter-spacing', newSize_ts + 'px', 'important');
          localStorage.setItem('ts-spacing', parseFloat(newSize_ts));
          }
        });
      }
  
  function resetLetterspacing() {
  var elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)');
  elements.forEach(function (element) {
  // Reset font-size style for all elements
  element.style.letterSpacing = ''; // Reset to default or "normal"
  localStorage.setItem('ts-spacing', null);
  localStorage.setItem('ts-clickCount', 0);
  localStorage.setItem('ts-buttonClicked', false);
  });
  }
  
  // Check and restore the state from localStorage on page load
  document.addEventListener('DOMContentLoaded', function() { 
  
    var featureItem_ts = document.getElementById('featureItem-ts');
  var featureSteps_ts = document.getElementById('featureSteps-ts');
  var tickIcon_ts = document.getElementById('tickIcon-ts');
    
    // Restore tickIcon visibility
    var SpacingState = JSON.parse(localStorage.getItem('ts-buttonClicked'));
    var SpacingClickState = JSON.parse(localStorage.getItem('ts-clickCount'));
    var SpacingSizeState = localStorage.getItem('ts-spacing');
  
    console.log( SpacingSizeState);
    
    if (SpacingState) {
    
      tickIcon_ts.style.display = 'inline-block';
      featureItem_ts.classList.add('feature-active');
      featureSteps_ts.classList.add('featureSteps-visible');
    
      var stepsHTML_ts = '';
      for (var i = 0; i < 3; i++) {
          stepsHTML_ts += '<span class="' + (i < SpacingClickState ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
      }
      featureSteps_ts.innerHTML = stepsHTML_ts;
    
      const elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)'); // Select all elements except buttons
    elements.forEach(function(element) {
    if (!isExcludedElement(element)) {
  // Handle cases where lineHeight is 'normal' or an invalid value
  
      // Convert to pixels (optional, depending on your needs)
      // currentSize_ts = SpacingSizeState + 'px';
      // element.style.letterSpacing = SpacingSizeState + 'px';
      element.style.setProperty('letter-spacing', SpacingSizeState + 'px', 'important');
          }
        });
    }
    
    });
  
  
  // ******************************************************************************* //
  
  // Line height script
  
  var clickCount_lh = 0;
  
  // Check local storage for previous state
  var localStorageClickCount = localStorage.getItem('lh-clickCount');
  if (localStorageClickCount) {
    clickCount_lh = parseInt(localStorageClickCount, 10);
  }
  
  document.addEventListener('click', function(event) {
  if (!event.target || !event.target.closest || !event.target.closest('#btn-s12')) return;
  clickCount_lh++;
  var featureItem_lh = document.getElementById('featureItem-lh');
  var featureSteps_lh = document.getElementById('featureSteps-lh');
  var tickIcon_lh = document.getElementById('tickIcon-lh');
  
    // Save current state to local storage
    localStorage.setItem('lh-clickCount', clickCount_lh);
    localStorage.setItem('lh-buttonClicked', true);
  
  // Reset on 5th click
  if (clickCount_lh === 4) {
    clickCount_lh = 0;
    featureItem_lh.classList.remove('feature-active');
    featureSteps_lh.classList.remove('featureSteps-visible');
    featureSteps_lh.innerHTML = '';
    tickIcon_lh.style.display = 'none';
    // Reset font size of all elements
  
    // Save current state to local storage
    localStorage.setItem('lh-clickCount', 0);
    localStorage.setItem('lh-buttonClicked', false);
  
    resetlineheight();
    return;
  }
  
  // Add feature-active class on the first click
  if (clickCount_lh === 1) {
      featureItem_lh.classList.add('feature-active');
      featureSteps_lh.classList.add('featureSteps-visible');
      localStorage.setItem('lh-clickCount', 1);
    localStorage.setItem('lh-buttonClicked', true);
  }
  
  // Update data-uw-reader-content attribute
  document.getElementById('btn-s12').setAttribute('data-uw-reader-content', clickCount_lh);
  // Add step span tags dynamically
  var stepsHTML_lh = '';
  for (var i = 0; i < 3; i++) {
      stepsHTML_lh += '<span class="' + (i < clickCount_lh ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
  }
  featureSteps_lh.innerHTML = stepsHTML_lh;
  // Display tick icon until the 4th click
  if (clickCount_lh < 4) {
      tickIcon_lh.style.display = 'inline-block';
  }
  
  increaseLineheight();
  
  });
  
  function increaseLineheight() {
  var elements = document.querySelectorAll('*:not(.uw-widget-custom-trigger, .uw-widget-custom-trigger span)');
    elements.forEach(function(element) {
       // Exclude elements inside #uw-main and with class .uwaw-features__item__name
       if (!isExcludedElement(element)) {
          var currentSize_lh = parseFloat(window.getComputedStyle(element).lineHeight);
          currentSize_lh = isNaN(currentSize_lh) ? 0 : currentSize_lh; // Handle cases where lineHeight is 'normal' or an invalid value
  
    // Convert to pixels (optional, depending on your needs)
    currentSize_lh = currentSize_lh + 'px';
    var newSize_lh = parseFloat(currentSize_lh) + 10 + 'px';
    localStorage.setItem('lh-height', parseFloat(newSize_lh));
    // element.style.lineHeight = newSize_lh;
    element.style.setProperty('line-height', newSize_lh, 'important'); /*add er*/
  
       }
   });
  }
  
  function resetlineheight() {
  var elements = document.querySelectorAll('*');
  elements.forEach(function (element) {
  // Reset font-size style for all elements
  element.style.lineHeight = ''; // Reset to default or "normal"
  localStorage.setItem('lh-height', null);
  localStorage.setItem('lh-clickCount', 0);
  localStorage.setItem('lh-buttonClicked', false);
  });
  }
  
  // Check and restore the state from localStorage on page load
  document.addEventListener('DOMContentLoaded', function() { 
  
  var featureItem_lh = document.getElementById('featureItem-lh');
  var featureSteps_lh = document.getElementById('featureSteps-lh');
  var tickIcon_lh = document.getElementById('tickIcon-lh');
  
  // Restore tickIcon visibility
  var LineHeightState = JSON.parse(localStorage.getItem('lh-buttonClicked'));
  var LineHeightClickState = JSON.parse(localStorage.getItem('lh-clickCount'));
  var LineHeightSizeState = localStorage.getItem('lh-height');
  
  if (LineHeightState) {
  
    tickIcon_lh.style.display = 'inline-block';
    featureItem_lh.classList.add('feature-active');
    featureSteps_lh.classList.add('featureSteps-visible');
  
    var stepsHTML_lh = '';
    for (var i = 0; i < 3; i++) {
        stepsHTML_lh += '<span class="' + (i < LineHeightClickState ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
    }
    featureSteps_lh.innerHTML = stepsHTML_lh;
  
    var elements = document.querySelectorAll('*');
    elements.forEach(function(element) {
       // Exclude elements inside #uw-main and with class .uwaw-features__item__name
       if (!isExcludedElement(element)) {
          var currentSize_lh = parseFloat(window.getComputedStyle(element).lineHeight);
          currentSize_lh = isNaN(currentSize_lh) ? 0 : currentSize_lh; // Handle cases where lineHeight is 'normal' or an invalid value
  
        // Convert to pixels (optional, depending on your needs)
        currentSize_lh = currentSize_lh + 'px';
        var newSize_lh = parseFloat(currentSize_lh) + parseFloat(LineHeightSizeState) + 'px';
        element.style.setProperty('line-height', newSize_lh, 'important');
       }
     });
  
  }
  
  });
  
  /***********************************************************************************************************/
  
  // Hide Images Script
  
  // Function to toggle the visibility of images
  function toggleImages() {
    document.documentElement.classList.toggle('image-hide');
    document.documentElement.id = document.documentElement.classList.contains('image-hide') ? 'imageHideBg' : '';
    var images = document.querySelectorAll('img');
    // var bgRemove = document.querySelectorAll('*');
    var imageVisibilityState = {};
    // var bgimageVisibilityState = {};
    var tickIcon_ht = document.getElementById('tickIcon-hi');
    var featureItem = document.getElementById('featureItem-hi');
  
    // Toggle the visibility of images
    images.forEach(function (image, index) {
        if (!isExcludedElement(image)) {
          image.style.setProperty('visibility', image.style.visibility === 'hidden' ? 'visible' : 'hidden', 'important');
          imageVisibilityState[index] = image.style.visibility;
          
        }
    });
  
  
    // Toggle the visibility of the tickIcon
    tickIcon_ht.style.display = tickIcon_ht.style.display === 'none' ? 'inline-block' : 'none';
  
    // Toggle the feature-active class on featureItem
    featureItem.classList.toggle('feature-active');
  
    localStorage.setItem('imageVisibilityState', JSON.stringify(imageVisibilityState));
  
  }
  
  // Check and restore the state from localStorage on page load
  document.addEventListener('DOMContentLoaded', function() {
  
    var tickIcon_ht = document.getElementById('tickIcon-hi');
    var featureItem = document.getElementById('featureItem-hi');
    var images = document.querySelectorAll('img');
  
    // Restore tickIcon visibility
    var imageVisibilityState = JSON.parse(localStorage.getItem('imageVisibilityState'));
  
    if (imageVisibilityState) {
      images.forEach(function (image, index) {
          if (!isExcludedElement(image) && imageVisibilityState[index]) {
            image.style.setProperty('visibility', imageVisibilityState[index], 'important');
  
          }
      });
    }
  
    if (imageVisibilityState && imageVisibilityState['1'] === 'hidden') {
        tickIcon_ht.style.display = 'inline-block';
        featureItem.classList.add('feature-active');
        document.documentElement.classList.toggle('image-hide');
        document.documentElement.id = document.documentElement.classList.contains('image-hide') ? 'imageHideBg' : '';
    }
  });
  
  // ******************************************************************************************************//
  
  // light dark mode
  
  // Toggle dark mode and save additional state when the button with ID 'dark-btn' is clicked
  document.addEventListener('click', function(event) {
  if (!event.target || !event.target.closest || !event.target.closest('#dark-btn')) return;
  
      var tickIcon_ht_dark = document.getElementById('tickIcon-ht-dark');
      var featureItemDrak = document.getElementById('featureItem-ht-dark');
      const checkbox = document.getElementById("checkbox");
  
      const isDarkMode = checkbox.checked;
      document.body.classList.toggle("dark", isDarkMode);
  
      // Toggle the visibility of the tickIcon
      tickIcon_ht_dark.style.display = tickIcon_ht_dark.style.display === 'none' ? 'inline-block' : 'none';
  
      // Toggle the feature-active class on featureItem
      featureItemDrak.classList.toggle('feature-active');
  
      // Save the state to local storage
      localStorage.setItem("darkMode", isDarkMode);
  
  });
  
  // Call applyDarkModeOnLoad function on page load
  document.addEventListener('DOMContentLoaded', function() {
  
    var tickIcon_ht_dark = document.getElementById('tickIcon-ht-dark');
    var featureItemDrak = document.getElementById('featureItem-ht-dark');
    const checkbox = document.getElementById("checkbox");
  
    const isDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (isDarkMode === true) {
    checkbox.checked = isDarkMode;
    document.body.classList.add("dark");
    tickIcon_ht_dark.style.display = 'inline-block';
    featureItemDrak.classList.toggle('feature-active');
    }
  
  });
  
  /******************************************************************************************************/
  
  //Highlight Links Script
  
  // Function to toggle the highlight links feature and save state in local storage
  function highlightLinks() {
  
    var tickIcon_ht = document.getElementById('tickIcon-ht');
    var featureItem = document.getElementById('featureItem-ht');
    var HighlightLinkState = [];
  
    // Toggle the visibility of the tickIcon
    tickIcon_ht.style.display = tickIcon_ht.style.display === 'none' ? 'inline-block' : 'none';
  
    // Toggle the feature-active class on featureItem
    featureItem.classList.toggle('feature-active');
  
    // Toggle the highlight of links
    var links = document.querySelectorAll('a');
    links.forEach(function (link, index) {
        if (!isExcludedElement(link)) {
            link.style.setProperty('background', link.style.background ? '' : 'black', 'important');
            link.style.setProperty('color', link.style.color ? '' : 'yellow', 'important');
            // Set HighlightLinkState based on the background color
            HighlightLinkState = link.style.getPropertyValue('background') === 'black !important' && link.style.getPropertyValue('color') === 'yellow !important';
        }
    });
  
    // Save state in local storage
    localStorage.setItem("highlightLinks", JSON.stringify(HighlightLinkState));
  }
  
  // Check and restore the state from localStorage on page load
  document.addEventListener('DOMContentLoaded', function() {
  
    var tickIcon_ht = document.getElementById('tickIcon-ht');
    var featureItem = document.getElementById('featureItem-ht');
    var links = document.querySelectorAll('a');
  
    // Restore tickIcon visibility
    var GetHighlightLinkState = JSON.parse(localStorage.getItem('highlightLinks'));
    if (GetHighlightLinkState === true) {
      links.forEach(function (link, index) {
          if (!isExcludedElement(link) && GetHighlightLinkState) {
            link.style.setProperty('background', link.style.background ? '' : '#1C1D1F', 'important');
            link.style.setProperty('color', link.style.color ? '' : 'yellow', 'important');
          }
      });
    }
  
    if (GetHighlightLinkState && GetHighlightLinkState === true) {
        tickIcon_ht.style.display = 'inline-block';
        featureItem.classList.add('feature-active');
    }
  });
  
  /*******************************************************************************************************/
  
  //Cursor Script
  
  // Function to toggle the cursor feature and save state in local storage
  function toggleCursorFeature() {
    // Toggle the 'ux4g-bg-cursor' class on the body
    document.documentElement.classList.toggle('ux4g-bg-cursor');
  
    // Toggle the tick icon
    var tickIcon_cursor = document.getElementById('tickIcon-cursor');
    tickIcon_cursor.style.display = tickIcon_cursor.style.display === 'none' ? 'inline-block' : 'none';
  
    var featureItem = document.getElementById('featureItem-Cursor');
  
    // Toggle the feature-active class on featureItem
    featureItem.classList.toggle('feature-active');
  
    // Save state in local storage
    localStorage.setItem("cursorFeatureActive", featureItem.classList.contains('feature-active'));
  }
  
  document.addEventListener('DOMContentLoaded', function() { 
  
    var GetCursorState = JSON.parse(localStorage.getItem('cursorFeatureActive'));
    var tickIcon_cursor = document.getElementById('tickIcon-cursor');
    var featureItem = document.getElementById('featureItem-Cursor');
  
    if (GetCursorState === true) { 
      document.documentElement.classList.add('ux4g-bg-cursor');
      tickIcon_cursor.style.display = 'inline-block';
      featureItem.classList.add('feature-active');
    }
  
  });
  
  
  /*****************************************************************************************************/
  
  //Dyslexia Font Code
  
  function toggleFontFeature() {
  
    // Toggle the 'ux4g-font-df' class on the body
    document.documentElement.classList.toggle('ux4g-font-df');
  
    // Toggle the tick icon
    var tickIcon_df = document.getElementById('tickIcon-df');
    tickIcon_df.style.display = tickIcon_df.style.display === 'none' ? 'inline-block' : 'none';
  
    var featureItem = document.getElementById('featureItem-df');
  
    // Toggle the feature-active class on featureItem
    featureItem.classList.toggle('feature-active');
  
    // Save state in local storage
    localStorage.setItem("dyslexia", document.documentElement.classList.contains('ux4g-font-df'));
  
  }
  
  document.addEventListener('DOMContentLoaded', function() { 
  
    var GetdyslexiaState = JSON.parse(localStorage.getItem('dyslexia'));
    var tickIcon_df = document.getElementById('tickIcon-df');
    var featureItem_df = document.getElementById('featureItem-df');
  
    if (GetdyslexiaState === true) { 
      document.documentElement.classList.add('ux4g-font-df');
      tickIcon_df.style.display = 'inline-block';
      featureItem_df.classList.add('feature-active');
    }
  
  });
  
  /***************************************************************************************************/
  
  // invert script
  
  // Function to toggle the 'Invert' feature
  document.addEventListener('click', function(event) {
  if (!event.target || !event.target.closest || !event.target.closest('#btn-invert')) return;
  
    // Toggle the 'invert' class on the body
    document.documentElement.classList.toggle('ux4g-bg-white');
  
    // Toggle the tick icon
    var tickIcon_ic = document.getElementById('tickIcon-ic');
    tickIcon_ic.style.display = tickIcon_ic.style.display === 'none' ? 'inline-block' : 'none';
  
    var featureItem = document.getElementById('featureItem-ic');
  
    // Toggle the feature-active class on featureItem
    featureItem.classList.toggle('feature-active');
  
    // Save the state in localStorage
    localStorage.setItem('invertFeature', document.documentElement.classList.contains('ux4g-bg-white'));
  
  });
  
  document.addEventListener('DOMContentLoaded', function() { 
  
    var GetInvertState = JSON.parse(localStorage.getItem('invertFeature'));
    var tickIcon_ic = document.getElementById('tickIcon-ic');
    var featureItem_ic = document.getElementById('featureItem-ic');
  
    if (GetInvertState === true) { 
      document.documentElement.classList.add('ux4g-bg-white');
      tickIcon_ic.style.display = 'inline-block';
      featureItem_ic.classList.add('feature-active');
    }
  
  }); // Close the preceding DOMContentLoaded restore-state handler.

/***************************************************************************************************/

// Text size: Text Size Increase (#btn-s9) and Text Size Decrease (#btn-small-text)
// The site sizes text in rem (html font-size 62.5%), so changing the root size scales all text
// evenly – no element is resized twice. Up to 4 steps larger or 3 steps smaller, 10% per step;
// clicking past the last step returns to normal. The choice is kept on every page.
(function () {
  var BASE = 62.5, STEP = 0.10, MAX = 4, MIN = -3, KEY = 'ux4g-text-step';
  var UP = { btn: 'btn-s9', item: 'featureItem-text-increase', steps: 'featureSteps-increase', tick: 'tickIcon-increase', count: MAX };
  var DOWN = { btn: 'btn-small-text', item: 'featureItem-st', steps: 'featureSteps-st', tick: 'tickIcon-st', count: -MIN };

  // clear values left by the old script, which could keep a button disabled
  ['bt-size', 'bt-clickCount', 'bt-buttonClicked', 'st-size', 'st-clickCount', 'st-buttonClicked', 'btn-big', 'btn-small']
    .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });

  function getStep() {
    var v = 0;
    try { v = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) {}
    return Math.max(MIN, Math.min(MAX, v));
  }
  function paint(c, active, n) {
    var item = document.getElementById(c.item), steps = document.getElementById(c.steps),
        tick = document.getElementById(c.tick), btn = document.getElementById(c.btn);
    if (btn) { btn.disabled = false; btn.setAttribute('aria-pressed', active ? 'true' : 'false'); }
    if (item) item.classList.toggle('feature-active', active);
    if (tick) tick.style.display = active ? 'inline-block' : 'none';
    if (steps) {
      if (active) {
        var h = '';
        for (var i = 0; i < c.count; i++) h += '<span class="' + (i < n ? 'active step uwaw-features__step' : 'step uwaw-features__step') + '"></span>';
        steps.innerHTML = h; steps.classList.add('featureSteps-visible');
      } else { steps.innerHTML = ''; steps.classList.remove('featureSteps-visible'); }
    }
  }
  function apply(step) {
    var root = document.documentElement;
    if (step === 0) root.style.removeProperty('font-size');
    else root.style.setProperty('font-size', (BASE * (1 + STEP * step)) + '%', 'important');
    try { if (step === 0) localStorage.removeItem(KEY); else localStorage.setItem(KEY, String(step)); } catch (e) {}
    paint(UP, step > 0, Math.max(step, 0));
    paint(DOWN, step < 0, Math.max(-step, 0));
  }

  document.addEventListener('click', function (event) {
    var t = event.target;
    if (!t || typeof t.closest !== 'function') return;
    if (t.closest('#btn-s9')) {
      event.preventDefault();
      var s1 = getStep(); apply(s1 >= MAX ? 0 : s1 + 1);
    } else if (t.closest('#btn-small-text')) {
      event.preventDefault();
      var s2 = getStep(); apply(s2 <= MIN ? 0 : s2 - 1);
    }
  });

  // Reset All (resetAll fires 'ux4g:reset')
  document.addEventListener('ux4g:reset', function () { apply(0); });

  // restore on load: the size at once, the panel display when the footer has loaded
  var start = getStep();
  if (start !== 0) document.documentElement.style.setProperty('font-size', (BASE * (1 + STEP * start)) + '%', 'important');
  function ready() { return document.getElementById(UP.btn) && document.getElementById(DOWN.btn); }
  function init() {
    if (ready()) { apply(getStep()); return; }
    var obs = new MutationObserver(function () { if (ready()) { obs.disconnect(); apply(getStep()); } });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 15000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/***************************************************************************************************/

// Dark Contrast and Saturation
// The footer panel has #btn-contrast (data-action="toggle-dark-contrast") and #btn-saturation
// (data-action="toggle-saturation"), and accessibility-style.css styles html.ux4g-dark-contrast and
// html.ux4g-saturation, but nothing switched those classes on. These two toggles do that.
// Delegated clicks, so they work although the panel is loaded later by components.js.
(function () {
  var TOGGLES = [
    { btn: 'btn-contrast',   cls: 'ux4g-dark-contrast', key: 'darkContrast', item: 'featureItem-contrast',   tick: 'tickIcon-contrast' },
    { btn: 'btn-saturation', cls: 'ux4g-saturation',    key: 'saturation',   item: 'featureItem-saturation', tick: 'tickIcon-saturation' }
  ];

  function showState(t, on) {
    var item = document.getElementById(t.item);
    var tick = document.getElementById(t.tick);
    var btn = document.getElementById(t.btn);
    if (item) item.classList.toggle('feature-active', on);
    if (tick) { tick.style.display = on ? 'inline-block' : 'none'; tick.classList.toggle('is-hidden', !on); }
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function setToggle(t, on) {
    document.documentElement.classList.toggle(t.cls, on);
    try { localStorage.setItem(t.key, on ? 'true' : 'false'); } catch (e) {}
    showState(t, on);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    TOGGLES.forEach(function (t) {
      if (target.closest('#' + t.btn)) {
        event.preventDefault();
        var on = !document.documentElement.classList.contains(t.cls);
        // Dark Contrast and Invert both recolour the page; switching one on switches the other off.
        if (on && t.cls === 'ux4g-dark-contrast' && document.documentElement.classList.contains('ux4g-bg-white')) {
          var inv = document.getElementById('btn-invert');
          if (inv) inv.click();
        }
        setToggle(t, on);
      }
    });
  });

  // Restore after a page load: the page colours straight away, the panel ticks once the footer is in.
  function stored(t) {
    try { return localStorage.getItem(t.key) === 'true'; } catch (e) { return false; }
  }
  TOGGLES.forEach(function (t) {
    if (stored(t)) document.documentElement.classList.add(t.cls);
  });
  function restoreTicks() {
    var done = true;
    TOGGLES.forEach(function (t) {
      if (!document.getElementById(t.btn)) { done = false; return; }
      showState(t, document.documentElement.classList.contains(t.cls));
    });
    return done;
  }
  function start() {
    if (restoreTicks()) return;
    var obs = new MutationObserver(function () { if (restoreTicks()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 15000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  // Used by Reset All
  window.ux4gResetToggles = function () {
    TOGGLES.forEach(function (t) {
      document.documentElement.classList.remove(t.cls);
      try { localStorage.removeItem(t.key); } catch (e) {}
      showState(t, false);
    });
  };
})();

// Accessibility panel open/close handling.
// Delegated events support triggers and panel markup loaded dynamically.
function openMain() {
  var panel = document.getElementById('uw-main');
  if (!panel) {
    console.error('UX4G: Accessibility panel #uw-main was not found.');
    return;
  }

  panel.classList.remove('uwaw-initial');
  panel.classList.add('is-open', 'accessibility-panel-open');
  panel.style.setProperty('display', 'block', 'important');
  panel.style.setProperty('visibility', 'visible', 'important');
  panel.style.setProperty('opacity', '1', 'important');
  panel.style.setProperty('position', 'fixed', 'important');
  panel.style.setProperty('right', '0', 'important');
  panel.style.setProperty('left', 'auto', 'important');
  panel.style.setProperty('top', '0', 'important');
  panel.style.setProperty('width', 'min(490px, 100vw)', 'important');
  panel.style.setProperty('height', '100vh', 'important');
  panel.style.setProperty('max-height', '100vh', 'important');
  panel.style.setProperty('overflow-y', 'auto', 'important');
  panel.style.setProperty('z-index', '2147483647', 'important');
  panel.style.setProperty('transform', 'none', 'important');
  panel.setAttribute('aria-hidden', 'false');

  document.querySelectorAll('#uw-widget-custom-trigger, #uw-widget-custom-trigger2, .uw-widget-custom-trigger').forEach(function (trigger) {
    trigger.setAttribute('aria-controls', 'uw-main');
    trigger.setAttribute('aria-expanded', 'true');
  });
}
window.openMain = openMain;
window.openAccessibility = openMain;
window.openAccessibilityPanel = openMain;

function closeMain() {
  var panel = document.getElementById('uw-main');
  if (panel) {
    panel.classList.remove('is-open', 'accessibility-panel-open');
    panel.style.setProperty('right', '-490px', 'important');
    panel.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('#uw-widget-custom-trigger, #uw-widget-custom-trigger2, .uw-widget-custom-trigger').forEach(function (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  });
}
window.closeMain = closeMain;
window.closeAccessibility = closeMain;
window.closeAccessibilityPanel = closeMain;

// Install once, immediately; this still works if the widget markup is inserted later.
if (!document.documentElement.dataset.ux4gPanelDelegationAttached) {
  document.documentElement.dataset.ux4gPanelDelegationAttached = 'true';
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var trigger = target.closest('#uw-widget-custom-trigger, #uw-widget-custom-trigger2, .uw-widget-custom-trigger');
    if (trigger) {
      event.preventDefault();
      openMain();
      return;
    }

    var closeButton = target.closest('#uw-main .uwaw-close, #uw-main [data-action="close-main"], #uw-main .close-accessibility');
    if (closeButton) {
      event.preventDefault();
      closeMain();
    }
  });
}

  // Delegated feature clicks support controls inserted after this script loads.
  if (!document.documentElement.dataset.ux4gFeatureDelegationAttached) {
    document.documentElement.dataset.ux4gFeatureDelegationAttached = 'true';
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      var button = target.closest('#btn-s10, #btn-s13, #btn-df, #btn-s11, #btn-cursor, #reset-all');
      if (!button) return;
      switch (button.id) {
        case 'btn-s10': highlightLinks(); break;
        case 'btn-s13': increaseAndReset(); break;
        case 'btn-df': toggleFontFeature(); break;
        case 'btn-s11': toggleImages(); break;
        case 'btn-cursor': toggleCursorFeature(); break;
        case 'reset-all': resetAll(); break;
      }
    });
  }

  // Reset All Script
  
  function resetAll() {
    // Stop any ongoing screen-reader speech.
    try {
      if (typeof window.resetSpeechFeature === 'function') {
        window.resetSpeechFeature();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.warn('Unable to stop accessibility speech:', error);
    }

    // Restore visual changes made by accessibility controls.
    document.documentElement.classList.remove(
      'image-hide',
      'ux4g-bg-white',
      'ux4g-font-df',
      'ux4g-bg-cursor',
      'ux4g-dark-contrast',
      'ux4g-saturation'
    );
    if (typeof window.ux4gResetToggles === 'function') window.ux4gResetToggles();
    if (document.documentElement.id === 'imageHideBg') {
      document.documentElement.removeAttribute('id');
    }
    document.body.classList.remove('dark');

    document.querySelectorAll('*').forEach(function (element) {
      element.style.removeProperty('font-size');
      element.style.removeProperty('letter-spacing');
      element.style.removeProperty('line-height');
    });

    document.querySelectorAll('img').forEach(function (image) {
      image.style.removeProperty('visibility');
    });

    document.querySelectorAll('a').forEach(function (link) {
      link.style.removeProperty('background');
      link.style.removeProperty('color');
    });

    // Reset feature indicators, ticks and progress bars.
    document.querySelectorAll('.reset-feature, .feature-active').forEach(function (item) {
      item.classList.remove('feature-active');
    });
    document.querySelectorAll('.reset-tick, [id^="tickIcon"]').forEach(function (tick) {
      tick.style.display = 'none';
    });
    document.querySelectorAll('.reset-steps, .featureSteps-visible').forEach(function (steps) {
      steps.innerHTML = '';
      steps.classList.remove('featureSteps-visible');
    });

    // Reset controls.
    var checkbox = document.getElementById('checkbox');
    if (checkbox) checkbox.checked = false;

    ['btn-s9', 'btn-small-text'].forEach(function (id) {
      var button = document.getElementById(id);
      if (button) button.disabled = false;
    });

    var speakButton = document.getElementById('speak');
    if (speakButton) speakButton.setAttribute('aria-pressed', 'false');

    // Reset stored values used by this widget.
    [
      'highlightLinks', 'imageVisibilityState', 'invertFeature', 'dyslexia',
      'cursorFeatureActive', 'darkMode', 'speak', 'darkContrast', 'saturation', 'ux4g-text-step',
      'bt-size', 'bt-clickCount', 'bt-buttonClicked',
      'st-size', 'st-clickCount', 'st-buttonClicked',
      'btn-big', 'btn-small',
      'ts-spacing', 'ts-clickCount', 'ts-buttonClicked',
      'lh-height', 'lh-clickCount', 'lh-buttonClicked'
    ].forEach(function (key) {
      localStorage.removeItem(key);
    });

    // Reset in-memory font-size, spacing and line-height counters.
    document.dispatchEvent(new Event('ux4g:reset'));
    if (typeof clickCountText !== 'undefined') clickCountText = 0;
    if (typeof letterSpacing !== 'undefined') letterSpacing = 0;
    if (typeof clickCount_lh !== 'undefined') clickCount_lh = 0;

    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }

  window.resetAll = resetAll;

    /*****************  Screen Reader Script*************/  

  (function initScreenReader() {
    var speakEl = document.getElementById('speak');
    if (!speakEl) {
      // The widget may be injected after this script. Retry when its layout is ready.
      document.addEventListener('mshec:layout-ready', function retryScreenReader() {
        if (document.getElementById('speak') &&
            document.documentElement.dataset.ux4gScreenReaderInitialized !== 'true') {
          document.documentElement.dataset.ux4gScreenReaderInitialized = 'true';
          initScreenReader();
        }
      });
      return;
    }
    if (document.documentElement.dataset.ux4gScreenReaderInitialized === 'true') return;
    document.documentElement.dataset.ux4gScreenReaderInitialized = 'true';

    var isReading = false;
    var previousSelectedElement = null;
    var allowedTags = ['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'LI', 'LABEL', 'TD', 'TH', 'STRONG', 'EM', 'B', 'I', 'U', 'SMALL', 'BIG', 'SUB', 'SUP'];

    function isExcludedFromSpeak(element) {
      return element.closest('#uw-main, .uw-widget-custom-trigger, .uw-widget-custom-trigger2, #site-header, .uwaw');
    }

    window.resetSpeechFeature = function () {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isReading = false;
      previousSelectedElement = null;
      speakEl.setAttribute('aria-pressed', 'false');
      var tickIcon_sp = document.getElementById('tickIcon_sp');
      var featureItem_sp = document.getElementById('featureItem_sp');
      if (tickIcon_sp) {
        tickIcon_sp.style.display = 'none';
      }
      if (featureItem_sp) {
        featureItem_sp.classList.remove('feature-active');
      }
    };

    function startReading(text) {
      if (!window.speechSynthesis || !text || !text.trim()) {
        return;
      }

      var utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 0.7;
      utterance.pitch = 1.0;

      var voices = window.speechSynthesis.getVoices();
      var femaleVoice = voices.find(function (voice) {
        return voice.name.includes('female') && voice.lang.includes('en');
      });
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.addEventListener('end', resetSelection);
      window.speechSynthesis.speak(utterance);
    }

    function resetSelection() {
      var selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      previousSelectedElement = null;
    }

    function selectAndSpeak(element) {
      var range = document.createRange();
      range.selectNodeContents(element);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      var text = selection.toString();
      if (!text || !text.trim()) {
        return;
      }

      if (previousSelectedElement !== element) {
        window.speechSynthesis.cancel();
        startReading(text);
        previousSelectedElement = element;
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
    }

    speakEl.addEventListener('click', function () {
      var featureItem_sp = document.getElementById('featureItem_sp');
      var tickIcon_sp = document.getElementById('tickIcon_sp');
      var active = featureItem_sp ? featureItem_sp.classList.toggle('feature-active') : false;

      if (tickIcon_sp) {
        tickIcon_sp.style.display = active ? 'inline-block' : 'none';
      }

      speakEl.setAttribute('aria-pressed', active ? 'true' : 'false');

      if (active) {
        isReading = true;
      } else {
        window.resetSpeechFeature();
        isReading = false;
      }

      localStorage.setItem('speak', active);
    });

    document.addEventListener('mouseup', function (event) {
      if (!isReading) {
        return;
      }

      var clickedElement = event.target;
      if (isExcludedFromSpeak(clickedElement)) {
        return;
      }

      if (allowedTags.includes(clickedElement.tagName.toUpperCase())) {
        selectAndSpeak(clickedElement);
      }
    });

    function restoreSpeakState() {
      var GetspeakState = false;
      try {
        GetspeakState = JSON.parse(localStorage.getItem('speak')) === true;
      } catch (err) {
        GetspeakState = false;
      }

      var tickIcon_sp = document.getElementById('tickIcon_sp');
      var featureItem_sp = document.getElementById('featureItem_sp');

      if (GetspeakState && tickIcon_sp && featureItem_sp) {
        tickIcon_sp.style.display = 'inline-block';
        featureItem_sp.classList.add('feature-active');
        speakEl.setAttribute('aria-pressed', 'true');
        isReading = true;
      }
    }

    restoreSpeakState();
    document.addEventListener('mshec:layout-ready', restoreSpeakState);
  })();
  
  
  
    
  
  // end here