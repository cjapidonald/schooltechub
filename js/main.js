(() => {
  const LETTER_SELECTOR = '[data-letter], .letter';
  const letterStates = new WeakMap();
  const registeredLetters = new WeakSet();
  const animationHandlers = new WeakMap();
  const geometryCtor = typeof SVGGeometryElement !== 'undefined' ? SVGGeometryElement : null;
  let prefersReducedMotionQuery = null;

  const attributeObserver = new MutationObserver((mutations) => {
    const processed = new Set();

    for (const mutation of mutations) {
      const target = mutation.target;

      if (!isElement(target) || processed.has(target)) continue;

      processed.add(target);
      evaluateLetterState(target);
    }
  });

  const treeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!isElement(node)) return;

        if (node.matches(LETTER_SELECTOR)) {
          registerLetter(node);
        }

        node.querySelectorAll?.(LETTER_SELECTOR).forEach((child) => {
          registerLetter(child);
        });
      });
    }
  });

  function isElement(node) {
    return node instanceof Element;
  }

  function shouldReduceMotion() {
    return Boolean(prefersReducedMotionQuery?.matches);
  }

  function forceReflow(element) {
    if (element instanceof HTMLElement) {
      void element.offsetWidth;
    } else if (typeof element?.getBoundingClientRect === 'function') {
      element.getBoundingClientRect();
    }
  }

  function restartFallbackAnimation(letterEl) {
    if (!isElement(letterEl)) return;

    const previousHandler = animationHandlers.get(letterEl);
    if (previousHandler) {
      letterEl.removeEventListener('animationend', previousHandler);
    }

    letterEl.classList.remove('letter-appear');
    forceReflow(letterEl);
    letterEl.classList.add('letter-appear');

    const handleAnimationEnd = (event) => {
      if (event.target !== letterEl) return;

      letterEl.classList.remove('letter-appear');
      letterEl.removeEventListener('animationend', handleAnimationEnd);
      animationHandlers.delete(letterEl);
    };

    animationHandlers.set(letterEl, handleAnimationEnd);
    letterEl.addEventListener('animationend', handleAnimationEnd);
  }

  function supportsPathLength(path) {
    if (!path) return false;

    if (geometryCtor) {
      return path instanceof geometryCtor && typeof path.getTotalLength === 'function';
    }

    return typeof path.getTotalLength === 'function';
  }

  function getStoredPathLength(path) {
    if (!supportsPathLength(path)) {
      return 0;
    }

    const existing = path.dataset?.handwritingLength;
    if (existing) {
      const parsed = Number(existing);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    try {
      const length = Math.ceil(path.getTotalLength());
      if (path.dataset) {
        path.dataset.handwritingLength = String(length);
      }
      return length;
    } catch (error) {
      console.warn('Unable to measure SVG path length for handwriting animation.', error);
      return 0;
    }
  }

  function prepareSvgPaths(letterEl) {
    if (!isElement(letterEl)) return false;

    const paths = letterEl.querySelectorAll?.('svg path');
    if (!paths?.length) return false;

    let preparedAny = false;
    paths.forEach((path) => {
      const length = getStoredPathLength(path);
      if (!length) return;

      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (!path.style.transition) {
        path.style.transition = 'stroke-dashoffset 420ms ease-out';
      }
      preparedAny = true;
    });

    if (preparedAny) {
      letterEl.classList.add('letter-handwriting');
    }

    return preparedAny;
  }

  function applySvgHandwriting(letterEl) {
    if (shouldReduceMotion()) return false;

    const paths = letterEl.querySelectorAll?.('svg path');
    if (!paths?.length) return false;

    const validPaths = [];

    paths.forEach((path) => {
      const length = getStoredPathLength(path);
      if (!length) return;

      validPaths.push({ path, length });
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });

    if (!validPaths.length) return false;

    validPaths.forEach(({ path }) => {
      path.getBoundingClientRect();
    });

    requestAnimationFrame(() => {
      validPaths.forEach(({ path }) => {
        path.style.strokeDashoffset = '0';
      });
    });

    return true;
  }

  function resetSvgPaths(letterEl) {
    const paths = letterEl.querySelectorAll?.('svg path');
    if (!paths?.length) return;

    paths.forEach((path) => {
      const length = getStoredPathLength(path);
      if (!length) return;

      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
  }

  function isLetterRevealed(letterEl) {
    if (!isElement(letterEl)) return false;

    if (letterEl.classList.contains('revealed') || letterEl.classList.contains('is-revealed')) {
      return true;
    }

    const dataState = letterEl.getAttribute('data-state');
    if (dataState && dataState.toLowerCase() === 'revealed') {
      return true;
    }

    const dataRevealed = letterEl.getAttribute('data-revealed') ?? letterEl.dataset?.revealed;
    if (dataRevealed && dataRevealed.toLowerCase() === 'true') {
      return true;
    }

    if (letterEl.getAttribute('aria-hidden') === 'false') {
      return true;
    }

    if (letterEl.getAttribute('aria-selected') === 'true') {
      return true;
    }

    if (letterEl.dataset?.active === 'true') {
      return true;
    }

    return !letterEl.hasAttribute('hidden') && letterEl.classList.contains('visible');
  }

  function runLetterRevealAnimation(letterEl, options = {}) {
    if (!isElement(letterEl)) return;

    const { skipSvg = false } = options;
    restartFallbackAnimation(letterEl);

    if (!skipSvg) {
      applySvgHandwriting(letterEl);
    }
  }

  function evaluateLetterState(letterEl) {
    if (!isElement(letterEl)) return;

    const currentState = isLetterRevealed(letterEl);
    const previousState = letterStates.get(letterEl) ?? false;

    if (currentState && !previousState) {
      runLetterRevealAnimation(letterEl);
    } else if (!currentState && previousState) {
      resetSvgPaths(letterEl);
    }

    letterStates.set(letterEl, currentState);
  }

  function registerLetter(letterEl) {
    if (!isElement(letterEl) || registeredLetters.has(letterEl)) return;

    registeredLetters.add(letterEl);
    prepareSvgPaths(letterEl);

    attributeObserver.observe(letterEl, {
      attributes: true,
      attributeFilter: ['class', 'data-state', 'data-revealed', 'data-active', 'aria-hidden', 'aria-selected', 'hidden'],
    });

    const initialState = isLetterRevealed(letterEl);
    letterStates.set(letterEl, initialState);

    if (initialState) {
      requestAnimationFrame(() => {
        runLetterRevealAnimation(letterEl);
      });
    }
  }

  function handleFocus(event) {
    const target = event.target;
    if (!isElement(target)) return;

    const letterEl = target.closest(LETTER_SELECTOR);
    if (!letterEl) return;

    registerLetter(letterEl);
    runLetterRevealAnimation(letterEl, { skipSvg: true });
  }

  function init() {
    prefersReducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

    document.querySelectorAll(LETTER_SELECTOR).forEach((letter) => {
      registerLetter(letter);
    });

    if (document.body) {
      treeObserver.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('focusin', handleFocus);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
