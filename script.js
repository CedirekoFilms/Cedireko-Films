/**
 * ============================================================================
 * CEDIREKO FILMS — Client Application Controllers
 * Architecture: Object-Oriented JavaScript (ES6+)
 * Milestone: M1 (Navigation, Scaffolding & Design Tokens)
 * ============================================================================
 */

/**
 * HeaderNavController
 * Encapsulates sticky header scroll observation, mobile drawer state machine,
 * ARIA synchronization, inert isolation, and smooth anchor navigation.
 */
class HeaderNavController {
  constructor(options = {}) {
    this.options = Object.assign({
      headerSelector: '.site-header',
      toggleSelector: '#mobile-nav-toggle, .site-header__burger, .menu-toggle',
      closeSelector: '#mobile-nav-close, .mobile-nav__close',
      navSelector: '#mobile-nav, .mobile-nav',
      panelSelector: '.mobile-nav__panel',
      backdropSelector: '.mobile-nav__backdrop',
      linksSelector: '.site-header__nav-link, .mobile-nav__link, .site-nav a, .mobile-nav a',
      scrollThreshold: 80,
      scrolledClass: 'site-header--scrolled',
      openClass: 'is-open',
      bodyLockClass: 'menu-open'
    }, options);

    this.header = document.querySelector(this.options.headerSelector);
    this.toggleBtn = document.querySelector(this.options.toggleSelector);
    this.closeBtn = document.querySelector(this.options.closeSelector);
    this.mobileNav = document.querySelector(this.options.navSelector);
    this.panel = document.querySelector(this.options.panelSelector);
    this.backdrop = document.querySelector(this.options.backdropSelector);
    this.navLinks = document.querySelectorAll(this.options.linksSelector);

    this.isOpen = false;
    this.isTicking = false;

    // Bind event handlers to maintain instance execution context
    this.handleScroll = this.handleScroll.bind(this);
    this.handleToggleClick = this.handleToggleClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  /**
   * Initializes event bindings and sets initial state
   */
  init() {
    if (!this.header) return;

    // Initialize toggle button ARIA attributes
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.setAttribute('aria-label', 'Open navigation menu');
      this.toggleBtn.addEventListener('click', this.handleToggleClick);
    }

    // Initialize mobile drawer accessibility attributes
    if (this.mobileNav) {
      this.mobileNav.setAttribute('aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        this.mobileNav.setAttribute('inert', '');
      }
    }

    // Bind dedicated close button inside drawer
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this.handleCloseClick);
    }

    // Bind backdrop click to dismiss
    if (this.backdrop) {
      this.backdrop.addEventListener('click', this.handleCloseClick);
    }

    // Passive scroll listener for 60/120fps execution
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Global document interaction listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('resize', this.handleResize, { passive: true });

    // Auto-close drawer on internal link clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', this.handleLinkClick);
    });

    // Check scroll position immediately on page load / refresh
    this.updateScrollState();

    this.initSectionSpy();
  }

  /**
   * Marks the nav link of the section crossing the middle of the screen
   * (aria-current="location"); CSS draws the accent line under it.
   */
  initSectionSpy() {
    if (!('IntersectionObserver' in window)) return;
    const sections = new Map();
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const section = href.startsWith('#') && href.length > 1 ? document.querySelector(href) : null;
      if (!section) return;
      if (!sections.has(section)) sections.set(section, []);
      sections.get(section).push(link);
    });
    if (!sections.size) return;

    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        sections.get(entry.target)?.forEach(link => {
          if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -55% 0px', threshold: 0 });
    sections.forEach((links, section) => this.sectionObserver.observe(section));
  }

  /**
   * Throttles scroll evaluation using requestAnimationFrame
   */
  handleScroll() {
    if (!this.isTicking) {
      this.isTicking = true;
      window.requestAnimationFrame(() => {
        this.updateScrollState();
        this.isTicking = false;
      });
    }
  }

  /**
   * Synchronizes scrolled class with window scroll position
   */
  updateScrollState() {
    if (!this.header) return;
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const shouldBeScrolled = currentScrollY > this.options.scrollThreshold;

    if (this.header.classList.contains(this.options.scrolledClass) !== shouldBeScrolled) {
      this.header.classList.toggle(this.options.scrolledClass, shouldBeScrolled);
    }
  }

  /**
   * Handles toggle button interactions
   */
  handleToggleClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.toggleMobileMenu();
  }

  /**
   * Handles explicit close button or backdrop clicks
   */
  handleCloseClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.closeMobileMenu();
  }

  /**
   * Inverts drawer state
   */
  toggleMobileMenu() {
    if (this.isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Returns background elements that must be isolated with inert when drawer is open
   * @returns {HTMLElement[]}
   */
  getBackgroundElements() {
    if (!this.backgroundElements) {
      this.backgroundElements = [
        document.querySelector('.site-header__container'),
        document.getElementById('main-content'),
        document.querySelector('.skip-link'),
        document.querySelector('footer')
      ].filter(Boolean);
    }
    return this.backgroundElements;
  }

  /**
   * Opens drawer, locks scroll, and configures accessibility
   */
  openMobileMenu() {
    if (this.isOpen || !this.mobileNav) return;

    this.isOpen = true;

    if (this.toggleBtn) {
      this.toggleBtn.classList.add('is-active');
      this.toggleBtn.setAttribute('aria-expanded', 'true');
      this.toggleBtn.setAttribute('aria-label', 'Close navigation menu');
    }

    this.mobileNav.classList.add(this.options.openClass);
    this.mobileNav.setAttribute('aria-hidden', 'false');
    if ('inert' in HTMLElement.prototype) {
      this.mobileNav.removeAttribute('inert');
      this.getBackgroundElements().forEach(el => el.setAttribute('inert', ''));
    }

    document.body.classList.add(this.options.bodyLockClass);

    // Direct focus to close button or panel
    if (this.closeBtn) {
      this.closeBtn.focus();
    } else if (this.panel) {
      this.panel.focus();
    }
  }

  /**
   * Closes drawer, releases scroll lock, and restores focus
   */
  closeMobileMenu() {
    if (!this.isOpen) return;

    this.isOpen = false;

    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('is-active');
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    }

    if (this.mobileNav) {
      this.mobileNav.classList.remove(this.options.openClass);
      this.mobileNav.setAttribute('aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        this.mobileNav.setAttribute('inert', '');
        this.getBackgroundElements().forEach(el => el.removeAttribute('inert'));
      }
    }

    document.body.classList.remove(this.options.bodyLockClass);

    // Return focus to toggle button for keyboard navigation continuity
    if (this.toggleBtn) {
      this.toggleBtn.focus();
    }
  }

  /**
   * Captures Escape key to dismiss drawer (WCAG 2.1 AA)
   */
  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closeMobileMenu();
    }
  }

  /**
   * Dismisses menu when clicking outside panel and toggle
   */
  handleDocumentClick(event) {
    if (!this.isOpen) return;

    const clickedInsidePanel = this.panel && this.panel.contains(event.target);
    const clickedToggle = this.toggleBtn && this.toggleBtn.contains(event.target);

    if (!clickedInsidePanel && !clickedToggle) {
      this.closeMobileMenu();
    }
  }

  /**
   * Automatically closes drawer upon clicking destination anchors
   */
  handleLinkClick(event) {
    const href = event.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      if (this.isOpen) {
        this.closeMobileMenu();
      }
    }
  }

  /**
   * Closes mobile drawer if viewport exceeds mobile breakpoint
   */
  handleResize() {
    if (this.isOpen && window.innerWidth >= 768) {
      this.closeMobileMenu();
    }
  }

  /**
   * Cleanly tears down all event listeners and state
   */
  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('resize', this.handleResize);
    this.sectionObserver?.disconnect();

    if (this.toggleBtn) {
      this.toggleBtn.removeEventListener('click', this.handleToggleClick);
    }
    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.handleCloseClick);
    }
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', this.handleCloseClick);
    }

    this.navLinks.forEach(link => {
      link.removeEventListener('click', this.handleLinkClick);
    });

    if ('inert' in HTMLElement.prototype) {
      this.getBackgroundElements().forEach(el => el.removeAttribute('inert'));
    }

    this.backgroundElements = null;
    document.body.classList.remove(this.options.bodyLockClass);
    this.isOpen = false;
  }
}

/**
 * ReelFilterController
 * Encapsulates multi-format filter bar state, tablist ARIA synchronization,
 * and responsive grid view switching.
 */
class ReelFilterController {
  #grid;
  #buttons;

  constructor(options = {}) {
    this.options = Object.assign({
      gridSelector: '.reel-grid',
      buttonsSelector: '.reel-toggle-btn, .filter-btn',
      activeClass: 'is-active'
    }, options);

    this.#grid = document.querySelector(this.options.gridSelector);
    this.#buttons = document.querySelectorAll(this.options.buttonsSelector);

    this.init();
  }

  init() {
    if (!this.#grid || !this.#buttons.length) return;

    this.#buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setView(view, btn);
      });

      // Keyboard arrow navigation across tablist (WAI-ARIA compliance)
      btn.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          targetIndex = (index + 1) % this.#buttons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          targetIndex = (index - 1 + this.#buttons.length) % this.#buttons.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = this.#buttons.length - 1;
        }

        if (targetIndex >= 0) {
          e.preventDefault();
          const targetBtn = this.#buttons[targetIndex];
          targetBtn.focus();
          this.setView(targetBtn.dataset.view, targetBtn);
        }
      });
    });
  }

  setView(view, activeBtn) {
    if (!this.#grid) return;

    // FLIP: remember where everything was, switch the view, then glide each
    // item from its old place to its new one. Items coming back into view replay
    // their letterbox reveal in CSS; the state change itself stays synchronous.
    const animate = this.#grid.classList.contains('is-visible')
      && this.#grid.dataset.view !== view
      && typeof this.#grid.animate === 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The FICO MANA row is display: contents from 640px (its cards are the grid items)
    // and a real swipe row on phones (it moves as one piece)
    const items = Array.from(this.#grid.children).flatMap(el => (
      el.classList.contains('reel-series-row') && getComputedStyle(el).display === 'contents'
        ? Array.from(el.children)
        : [el]
    ));
    const before = animate ? new Map(items.map(el => [el, el.getBoundingClientRect()])) : null;

    this.#grid.dataset.view = view;

    if (animate) {
      const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
      items.forEach(el => {
        const was = before.get(el);
        const now = el.getBoundingClientRect();
        if (!now.width) return; // filtered out
        if (!was.width) {
          // returning item that has no letterbox reveal of its own (the series header)
          if (!el.classList.contains('reel-card')) {
            el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing });
          }
          return;
        }
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        const sx = was.width / now.width;
        const sy = was.height / now.height;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
        el.animate([
          { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transformOrigin: 'top left', transform: 'none' }
        ], { duration: 560, easing });
      });
    }

    this.#buttons.forEach(btn => {
      const isSelected = btn === activeBtn || (!activeBtn && btn.dataset.view === view);
      btn.classList.toggle(this.options.activeClass, isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }
}

/**
 * SeriesRowController
 * Phones: the FICO MANA cards sit in a swipe row. Keeps the small "01 / 03"
 * counter in the series header in step with the card nearest the row's start.
 */
class SeriesRowController {
  #row;
  #count;
  #ticking = false;

  constructor() {
    this.#row = document.querySelector('.reel-series-row');
    this.#count = document.getElementById('reel-series-count');
    if (!this.#row || !this.#count) return;
    this.update = this.update.bind(this);
    this.#row.addEventListener('scroll', () => {
      if (this.#ticking) return;
      this.#ticking = true;
      window.requestAnimationFrame(() => {
        this.#ticking = false;
        this.update();
      });
    }, { passive: true });
    this.update();
  }

  update() {
    const cards = Array.from(this.#row.children);
    if (!cards.length) return;
    const start = this.#row.getBoundingClientRect().left;
    let nearest = 0;
    let best = Infinity;
    cards.forEach((card, i) => {
      const d = Math.abs(card.getBoundingClientRect().left - start);
      if (d < best) { best = d; nearest = i; }
    });
    // at the end of the row the last card can never reach the start edge
    if (this.#row.scrollLeft > 0 && this.#row.scrollLeft + this.#row.clientWidth >= this.#row.scrollWidth - 2) {
      nearest = cards.length - 1;
    }
    const pad = (n) => String(n).padStart(2, '0');
    this.#count.textContent = `${pad(nearest + 1)} / ${pad(cards.length)}`;
  }
}

/**
 * VideoModalPlayerController
 * Manages native HTML5 <dialog> modal player lifecycle, video buffering,
 * sequential transport navigation (prev/next), keyboard accessibility,
 * scroll locking, and light dismiss.
 */
class VideoModalPlayerController {
  #dialog;
  #video;
  #title;
  #cat;
  #tc;
  #scene;
  #closeBtn;
  #prevBtn;
  #nextBtn;
  #cards;
  #currentIndex;
  #lastActiveElement;
  #mouseDownInside;
  #upnext;
  #upnextTimer;
  #upnextRemaining;
  #isReducedMotion;
  #historyEntry = false;
  #pendingPops = 0;
  #closeShot = null;
  #navDirection = 0;
  #endSlate = null;
  #strip = null;
  #stripButtons = [];
  #watched = new Map();
  #pageTitle = document.title;

  constructor() {
    this.#dialog = document.getElementById('video-modal');
    if (!this.#dialog) return;

    this.#video = this.#dialog.querySelector('video');
    this.#title = this.#dialog.querySelector('#modal-title');
    this.#cat = this.#dialog.querySelector('#modal-cat');
    this.#tc = this.#dialog.querySelector('#modal-tc');
    this.#scene = this.#dialog.querySelector('#modal-scene');
    this.#closeBtn = this.#dialog.querySelector('.modal-close, button[aria-label*="close" i]');
    this.#prevBtn = this.#dialog.querySelector('#modal-prev-btn, .modal-prev');
    this.#nextBtn = this.#dialog.querySelector('#modal-next-btn, .modal-next');

    this.#cards = Array.from(document.querySelectorAll('.reel-card'));
    this.#currentIndex = -1;
    this.#lastActiveElement = null;
    this.#mouseDownInside = false;
    this.#upnextTimer = null;
    this.#upnextRemaining = 0;
    this.#isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#upnext = {
      panel: this.#dialog.querySelector('#modal-upnext'),
      count: this.#dialog.querySelector('#modal-upnext-count'),
      scene: this.#dialog.querySelector('#modal-upnext-scene'),
      title: this.#dialog.querySelector('#modal-upnext-title'),
      play: this.#dialog.querySelector('#modal-upnext-play'),
      cancel: this.#dialog.querySelector('#modal-upnext-cancel'),
      status: this.#dialog.querySelector('#modal-upnext-status'),
      seconds: 5
    };

    this.#endSlate = this.#dialog.querySelector('#modal-endslate');
    this.#strip = this.#dialog.querySelector('#modal-strip');

    this.navigate = this.navigate.bind(this);

    this.init();
  }

  init() {
    if (!this.#dialog) return;

    // Close button dismiss
    this.#closeBtn?.addEventListener('click', () => {
      this.close();
    });

    // Transport buttons: previous / next project
    this.#prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigate(-1);
    });

    this.#nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigate(1);
    });

    // Native cancel event (e.g. Esc key)
    this.#dialog.addEventListener('cancel', () => {
      this.#cleanupMedia();
    });

    // Keyboard controls when modal is active: Escape, ArrowLeft, ArrowRight
    document.addEventListener('keydown', (e) => {
      if (!this.#dialog || !this.#dialog.open) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.navigate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.navigate(1);
      }
    });

    // Modal keyboard focus trap (WCAG 2.1 AA dialog pattern)
    this.#dialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !this.#dialog.open) return;
      const focusables = Array.from(
        this.#dialog.querySelectorAll('button, [href], input, select, textarea, video, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Native close event
    this.#dialog.addEventListener('close', () => {
      this.#cleanupMedia();
    });

    // Backdrop dismissal tracking
    this.#dialog.addEventListener('mousedown', (e) => {
      const rect = this.#dialog.getBoundingClientRect();
      this.#mouseDownInside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
    });

    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) {
        const rect = this.#dialog.getBoundingClientRect();
        const isClickOutside = (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
        // Dismiss only when click is outside AND mousedown did not start inside
        if (isClickOutside && !this.#mouseDownInside) {
          this.close();
        }
      }
      this.#mouseDownInside = false;
    });

    // Stop click events inside modal content from reaching dialog backdrop
    const modalContent = this.#dialog.querySelector('.modal-dialog-content, .modal-inner');
    modalContent?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Loading state: a hairline sweeps across the top of the frame while the film buffers
    const frame = this.#video?.closest('.modal-video-container');
    if (frame) {
      const setLoading = (on) => {
        const loading = on && !!this.#video.getAttribute('src');
        frame.classList.toggle('is-loading', loading);
        frame.setAttribute('aria-busy', String(loading));
      };
      ['loadstart', 'waiting'].forEach(type => this.#video.addEventListener(type, () => setLoading(true)));
      ['canplay', 'playing', 'pause', 'error', 'emptied'].forEach(type => this.#video.addEventListener(type, () => setLoading(false)));
    }

    // Swipe across the film on a touch screen: left = next, right = previous.
    // Touches that start on the bottom strip are left to the native timeline controls.
    if (frame) {
      let start = null;
      frame.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        const rect = frame.getBoundingClientRect();
        start = (e.touches.length === 1 && t.clientY < rect.bottom - 64)
          ? { x: t.clientX, y: t.clientY, time: e.timeStamp }
          : null;
      }, { passive: true });
      frame.addEventListener('touchend', (e) => {
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const quick = e.timeStamp - start.time < 700;
        start = null;
        if (quick && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          this.navigate(dx < 0 ? 1 : -1);
        }
      }, { passive: true });
      frame.addEventListener('touchcancel', () => { start = null; }, { passive: true });
    }

    // Up next: when a film ends, offer the next one with a short countdown
    this.#video?.addEventListener('ended', () => this.#showUpNext());

    // End of reel (after the last film): replay it, or go back to the grid
    this.#dialog.querySelector('#modal-end-replay')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#hideUpNext();
      if (this.#video) {
        this.#video.currentTime = 0;
        this.#video.play().catch(() => {});
        this.#video.focus();
      }
    });
    this.#dialog.querySelector('#modal-end-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // Watched mark: remember how far each film got (this visit only)
    this.#video?.addEventListener('timeupdate', () => this.#recordProgress());
    this.#video?.addEventListener('ended', () => this.#recordProgress(1));

    this.#buildStrip();
    this.#upnext.play?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#hideUpNext();
      this.navigate(1);
      this.#video?.focus();
    });
    this.#upnext.cancel?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#hideUpNext();
      this.#video?.focus();
    });

    // Shareable links: #film/<slug> opens that film
    window.addEventListener('hashchange', () => this.#openFromHash());
    // Back (button, swipe or key) closes the viewer instead of leaving the site
    window.addEventListener('popstate', () => {
      if (this.#pendingPops > 0) {
        this.#pendingPops -= 1;
        return;
      }
      if (this.#dialog.open) {
        this.#historyEntry = false;
        this.close();
      }
    });
    this.#openFromHash();
  }

  #openFromHash() {
    const match = window.location.hash.match(/^#film\/([\w-]+)$/);
    if (!match) return;
    const card = this.#cards.find(c => c.dataset.film === match[1]);
    if (!card) {
      if (!this.#dialog?.open) this.#clearHash(); // unknown film link: drop it
      return;
    }
    if (this.#cards.indexOf(card) !== this.#currentIndex) this.open(card, { fromHash: true });
  }

  /** Opening a film from the grid adds a history entry (so Back closes it); moving between films replaces it */
  #syncHash(card, push) {
    const slug = card?.dataset.film;
    if (!slug || !window.history?.replaceState) return;
    if (push && window.history.pushState) {
      window.history.pushState({ cedirekoFilm: slug }, '', `#film/${slug}`);
      this.#historyEntry = true;
    } else {
      window.history.replaceState(window.history.state, '', `#film/${slug}`);
    }
  }

  /** On close: step back over the entry the viewer added, or just tidy the URL */
  #leaveHistoryEntry() {
    if (this.#historyEntry) {
      this.#historyEntry = false;
      this.#pendingPops += 1;
      window.history.back();
    } else {
      this.#clearHash();
    }
  }

  #clearHash() {
    if (!window.location.hash.startsWith('#film/') || !window.history?.replaceState) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  #showUpNext() {
    const { panel, count, scene, title, status, seconds } = this.#upnext;
    if (!panel || this.#currentIndex < 0) return;
    const nextCard = this.#cards[this.#currentIndex + 1];
    if (!nextCard) {
      // last film: the reel ends on a closing slate
      if (this.#endSlate) {
        this.#endSlate.hidden = false;
        if (status) status.textContent = 'End of the reel.';
      }
      return;
    }

    const nextTitle = nextCard.querySelector('.reel-title')?.textContent?.trim() || '';
    if (scene) scene.textContent = nextCard.dataset.scene || '';
    if (title) title.textContent = nextTitle;
    this.#upnextRemaining = seconds;
    if (count) count.textContent = String(seconds);
    panel.hidden = false;
    if (status) status.textContent = `Up next: ${nextTitle}. Plays in ${seconds} seconds.`;

    window.clearInterval(this.#upnextTimer);
    this.#upnextTimer = window.setInterval(() => {
      this.#upnextRemaining -= 1;
      if (count) count.textContent = String(Math.max(0, this.#upnextRemaining));
      if (this.#upnextRemaining <= 0) {
        const hadFocus = panel.contains(document.activeElement);
        this.#hideUpNext();
        this.navigate(1);
        if (hadFocus) this.#video?.focus();
      }
    }, 1000);
  }

  #hideUpNext() {
    window.clearInterval(this.#upnextTimer);
    this.#upnextTimer = null;
    if (this.#upnext.panel) this.#upnext.panel.hidden = true;
    if (this.#endSlate && !this.#endSlate.hidden) {
      // keep keyboard focus inside the viewer when the slate goes away
      if (this.#endSlate.contains(document.activeElement)) this.#video?.focus();
      this.#endSlate.hidden = true;
    }
    if (this.#upnext.status) this.#upnext.status.textContent = '';
  }

  /** Film strip (wide screens): one small poster per film; the current one is marked */
  #buildStrip() {
    if (!this.#strip) return;
    this.#stripButtons = this.#cards.map((card, index) => {
      const title = card.querySelector('.reel-title')?.textContent?.trim() || '';
      const poster = card.querySelector('.reel-video')?.dataset.poster || '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-strip__btn';
      btn.setAttribute('aria-label', `Play ${title}`);
      if (poster) {
        const img = document.createElement('img');
        img.src = poster;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 64;
        img.height = 44;
        btn.appendChild(img);
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (index === this.#currentIndex) return;
        this.#hideUpNext();
        this.#navDirection = Math.sign(index - this.#currentIndex);
        this.open(this.#cards[index]);
        this.#navDirection = 0;
      });
      this.#strip.appendChild(btn);
      return btn;
    });
  }

  #syncStrip() {
    this.#stripButtons.forEach((btn, index) => {
      if (index === this.#currentIndex) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  /** Watched mark: the furthest point reached in the film that is open */
  #recordProgress(force) {
    const card = this.#cards[this.#currentIndex];
    const v = this.#video;
    if (!card || !v) return;
    const fraction = force ?? (v.duration ? v.currentTime / v.duration : 0);
    if (!(fraction > 0)) return;
    this.#watched.set(card, Math.min(1, Math.max(this.#watched.get(card) || 0, fraction)));
  }

  /** Draws the mark on a card: a hairline along its bottom edge, as long as the part watched */
  #showWatched(card) {
    const fraction = this.#watched.get(card);
    if (!card || !fraction || fraction < 0.02) return;
    let mark = card.querySelector('.reel-watched');
    if (!mark) {
      mark = document.createElement('span');
      mark.className = 'reel-watched';
      mark.setAttribute('aria-hidden', 'true');
      card.appendChild(mark);
    }
    mark.style.setProperty('--watched', fraction.toFixed(4));
  }

  /** Opening from the grid or a link: letterbox bars part over the film (the site's signature move) */
  #playBars() {
    const frame = this.#dialog.querySelector('.modal-video-container');
    if (!frame || this.#isReducedMotion) return;
    frame.classList.remove('is-opening');
    void frame.offsetWidth; // restart the animation
    frame.classList.add('is-opening');
  }

  /** FLIP: the dialog opens at once (so state is synchronous), then grows out of the card it came from */
  #playOpenTransition(card) {
    if (this.#isReducedMotion || typeof this.#dialog.animate !== 'function') return;
    const from = card.getBoundingClientRect();
    const to = this.#dialog.getBoundingClientRect();
    const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const cardOnScreen = from.width > 0 && from.bottom > 0 && from.top < window.innerHeight;

    if (cardOnScreen && to.width > 0 && to.height > 0) {
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const sx = from.width / to.width;
      const sy = from.height / to.height;
      this.#dialog.animate([
        { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.6 },
        { transformOrigin: 'top left', transform: 'none', opacity: 1 }
      ], { duration: 560, easing });
    } else {
      this.#dialog.animate([
        { transform: 'scale(0.97)', opacity: 0 },
        { transform: 'none', opacity: 1 }
      ], { duration: 420, easing });
    }

    const info = this.#dialog.querySelector('.modal-info');
    [info, this.#closeBtn].forEach(el => {
      el?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 280, easing: 'ease-out', fill: 'backwards' });
    });
  }

  /**
   * Navigates sequentially across the reel items
   * @param {number} delta - (-1 for previous, +1 for next)
   */
  navigate(delta) {
    if (!this.#cards.length || this.#currentIndex < 0) return;
    this.#hideUpNext();
    const total = this.#cards.length;
    const nextIndex = (this.#currentIndex + delta + total) % total;
    this.#navDirection = Math.sign(delta);
    this.open(this.#cards[nextIndex]);
    this.#navDirection = 0;
  }

  open(cardOrIndex, { fromHash = false } = {}) {
    if (!this.#dialog) return;

    if (!this.#cards.length) {
      this.#cards = Array.from(document.querySelectorAll('.reel-card'));
    }

    // moving on from another film: leave its watched mark on its card
    if (this.#dialog.open && this.#currentIndex >= 0) this.#showWatched(this.#cards[this.#currentIndex]);

    let card;
    if (typeof cardOrIndex === 'number') {
      this.#currentIndex = (cardOrIndex + this.#cards.length) % this.#cards.length;
      card = this.#cards[this.#currentIndex];
    } else {
      card = cardOrIndex;
      this.#currentIndex = this.#cards.indexOf(card);
    }

    if (!card) return;

    const wasOpen = this.#dialog.open;
    if (!wasOpen) {
      this.#lastActiveElement = document.activeElement;
    }
    this.#hideUpNext();
    this.#syncStrip();

    const videoEl = card.querySelector('.reel-video, video');
    const src = videoEl?.dataset.src || videoEl?.src || '';
    const title = card.querySelector('.reel-title, h3')?.textContent?.trim() || 'FEATURED WORK';
    const cat = card.querySelector('.reel-cat')?.textContent?.trim() || 'COMMERCIAL';
    const tc = card.querySelector('.reel-tc span:last-child')?.textContent?.trim() || '00:00';
    const scene = card.dataset.scene || card.querySelector('.reel-scene')?.textContent?.trim() || `SC.0${this.#currentIndex + 1}`;

    if (this.#title) this.#title.textContent = title;
    document.title = `${title} — CEDIREKO Films`;
    if (this.#cat) this.#cat.textContent = cat;
    if (this.#tc) this.#tc.textContent = tc;
    if (this.#scene) this.#scene.textContent = scene;

    // Vertical films get a 9:16 viewer
    this.#dialog.classList.toggle('video-modal--portrait', card.dataset.orientation === 'portrait');

    if (this.#video && src) {
      this.#video.src = src;
      const cardVideo = card.querySelector('.reel-video');
      const poster = cardVideo?.getAttribute('poster') || cardVideo?.dataset.poster;
      if (poster) {
        this.#video.setAttribute('poster', poster);
      } else {
        this.#video.removeAttribute('poster');
      }
      this.#video.load();
      this.#video.play().catch(() => {});
    }

    document.body.style.overflow = 'hidden';

    if (!this.#dialog.open) {
      if (typeof this.#dialog.showModal === 'function') {
        this.#dialog.showModal();
      } else {
        this.#dialog.setAttribute('open', '');
      }
      this.#closeBtn?.focus();
      this.#playOpenTransition(card);
      this.#playBars();
    } else if (!this.#isReducedMotion) {
      // Next / previous inside the viewer: the new film pushes in from the side you
      // are heading to (Next from the right, Prev from the left); other changes just fade
      const shift = this.#navDirection * 56;
      this.#dialog.querySelector('.modal-video-container')?.animate([
        { opacity: 0, transform: `translateX(${shift}px)`, filter: shift ? 'blur(6px)' : 'none' },
        { opacity: 1, transform: 'none', filter: 'none' }
      ], { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }

    this.#syncHash(card, !wasOpen && !fromHash);
  }

  close() {
    if (!this.#dialog || !this.#dialog.open) return;

    this.#captureCloseShot();
    if (typeof this.#dialog.close === 'function') {
      this.#dialog.close();
    } else {
      this.#dialog.removeAttribute('open');
    }

    this.#cleanupMedia();
  }

  /**
   * Close transition, part 1: while the viewer is still on screen, remember where
   * the film sits and take a still of the current frame (or the poster).
   */
  #captureCloseShot() {
    if (this.#closeShot || this.#isReducedMotion || !this.#dialog?.open) return;
    if (this.#currentIndex < 0 || typeof document.body.animate !== 'function') return;
    const frame = this.#video?.closest('.modal-video-container') || this.#dialog;
    const from = frame.getBoundingClientRect();
    if (!from.width || !from.height) return;

    let image = '';
    const v = this.#video;
    try {
      if (v && v.readyState >= 2 && v.videoWidth) {
        const scale = Math.min(1, 640 / v.videoWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        // A near-black frame (a fade, the first second of a film) reads as a hole; use the poster instead
        const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < px.length; i += 4 * 97) { sum += px[i] + px[i + 1] + px[i + 2]; n += 3; }
        if (n && sum / n > 18) image = canvas.toDataURL('image/jpeg', 0.72);
      }
    } catch (err) {
      image = '';
    }
    if (!image) image = v?.getAttribute('poster') || '';

    this.#closeShot = { from, card: this.#cards[this.#currentIndex], image };
  }

  /**
   * Close transition, part 2: the still shrinks back into the card it came from
   * (or settles and fades if that card is hidden or off screen). Faster than the
   * open (420 ms vs 560 ms), as exits should be.
   */
  #playCloseShot() {
    const shot = this.#closeShot;
    this.#closeShot = null;
    if (!shot) return;

    const easing = 'cubic-bezier(0.65, 0, 0.35, 1)';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-ghost-backdrop';
    const ghost = document.createElement('div');
    ghost.className = 'modal-ghost';
    if (shot.image) {
      const img = document.createElement('img');
      img.src = shot.image;
      img.alt = '';
      ghost.appendChild(img);
    }
    const { from } = shot;
    Object.assign(ghost.style, {
      left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`
    });
    document.body.append(backdrop, ghost);

    const to = shot.card?.getBoundingClientRect();
    const cardOnScreen = to && to.width > 0 && to.bottom > 0 && to.top < window.innerHeight;
    // The still travels to the card on an ease-in-out curve, then dissolves into it
    let fade;
    if (cardOnScreen) {
      ghost.animate([
        { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
        { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` }
      ], { duration: 420, easing, fill: 'forwards' });
      fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, delay: 380, easing: 'linear', fill: 'forwards' });
    } else {
      fade = ghost.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'scale(0.96)', opacity: 0 }
      ], { duration: 300, easing, fill: 'forwards' });
    }
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'forwards' });
    const remove = () => { ghost.remove(); backdrop.remove(); };
    fade.onfinish = remove;
    fade.oncancel = remove;
    window.setTimeout(remove, 800); // safety net if the animation is interrupted
  }

  #cleanupMedia() {
    this.#captureCloseShot(); // Esc fires 'cancel' while the dialog is still open
    this.#playCloseShot();
    this.#hideUpNext();
    this.#leaveHistoryEntry();
    if (this.#currentIndex >= 0) this.#showWatched(this.#cards[this.#currentIndex]);
    document.title = this.#pageTitle;
    if (this.#video) {
      this.#video.pause();
      this.#video.removeAttribute('src');
      this.#video.load();
    }

    document.body.style.overflow = '';

    if (this.#lastActiveElement && typeof this.#lastActiveElement.focus === 'function') {
      this.#lastActiveElement.focus();
    }
    this.#lastActiveElement = null;
    this.#currentIndex = -1;
  }
}

/**
 * MediaPreviewController
 * Handles viewport lazy-loading and desktop hover preview playback.
 * Enforces single-video active playback across all preview cards.
 * On hover-capable devices, moving the pointer across a card scrubs the film
 * (left edge = start, right edge = end) and a hairline playhead shows the position;
 * the silent preview keeps playing from wherever the pointer stops.
 */
class MediaPreviewController {
  #cards;
  #videoModal;
  #observer;
  #currentlyPlaying;
  #centreObserver = null;
  #centreAreas = new Map();
  #centreVideo = null;

  constructor(videoModal) {
    this.#cards = document.querySelectorAll('.reel-card');
    this.#videoModal = videoModal;
    this.#currentlyPlaying = null;

    this.init();
  }

  #pauseCurrent() {
    this.#pauseCentre();
    if (this.#currentlyPlaying && !this.#currentlyPlaying.paused) {
      const card = this.#currentlyPlaying.closest('.reel-card');
      const seekTime = parseFloat(card?.dataset.seekTime || '1.0');
      this.#currentlyPlaying.pause();
      this.#currentlyPlaying.currentTime = seekTime;
      this.#currentlyPlaying = null;
    }
  }

  init() {
    if (!this.#cards.length) return;

    // Posters load lazily as cards approach the viewport. Film data is never
    // fetched here: touch devices only ever show the poster, and hover-capable
    // devices fetch a film the first time the pointer reaches its card.
    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        const poster = video.dataset.poster;
        if (poster && !video.getAttribute('poster')) video.setAttribute('poster', poster);
        video.classList.add('has-poster');
        this.#observer.unobserve(video);
      });
    }, {
      threshold: 0,
      rootMargin: '400px 0px 400px 0px'
    });

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Touch screens: the card in the middle of the screen plays a 3-second silent
    // loop (data-preview, about 140-290 KB each). Off with reduced motion or Save-Data.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;
    if (!canHover && !reducedMotion && !saveData && 'IntersectionObserver' in window) {
      this.#centreObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const r = entry.intersectionRect;
          this.#centreAreas.set(entry.target, entry.isIntersecting ? r.width * r.height : 0);
        });
        this.#playCentre();
      }, {
        rootMargin: '-30% 0px -30% 0px',
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1]
      });
      document.getElementById('video-modal')?.addEventListener('close', () => {
        window.setTimeout(() => this.#playCentre(), 450);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.#pauseCentre();
        else this.#playCentre();
      });
    }

    this.#cards.forEach(card => {
      const video = card.querySelector('.reel-video');
      const dataSrc = video?.dataset.src;

      if (video) this.#observer.observe(video);

      if (video && this.#centreObserver) this.#centreObserver.observe(card);

      if (video && dataSrc && canHover) {
        this.#attachScrub(card, video);

        card.addEventListener('mouseenter', () => {
          this.#loadSource(card, video);
          if (this.#currentlyPlaying && this.#currentlyPlaying !== video) {
            this.#pauseCurrent();
          }
          this.#currentlyPlaying = video;
          video.play().catch(() => {});
        });

        card.addEventListener('mouseleave', () => {
          video.pause();
          if (this.#currentlyPlaying === video) {
            this.#currentlyPlaying = null;
          }
          const seekTime = parseFloat(card.dataset.seekTime || '1.0');
          setTimeout(() => { if (video.readyState > 0) video.currentTime = seekTime; }, 200);
        });
      }

      card.addEventListener('click', (e) => {
        e.preventDefault();
        this.#pauseCurrent();
        this.#videoModal?.open(card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#pauseCurrent();
          this.#videoModal?.open(card);
        }
      });
    });
  }

  /** Touch screens: play the loop of the card that covers most of the screen's middle band */
  #playCentre() {
    if (!this.#centreObserver || document.hidden) return;
    if (document.getElementById('video-modal')?.open) return;
    let best = null;
    let bestArea = 0;
    this.#centreAreas.forEach((area, card) => {
      if (area > bestArea) { bestArea = area; best = card; }
    });
    const video = best?.querySelector('.reel-video');
    if (video === this.#centreVideo && video && !video.paused) return;
    this.#pauseCentre();
    if (!video?.dataset.preview) return;
    if (video.getAttribute('src') !== video.dataset.preview) {
      video.preload = 'auto';
      video.src = video.dataset.preview;
      video.classList.add('has-src');
    }
    this.#centreVideo = video;
    video.play().catch(() => {});
  }

  #pauseCentre() {
    if (this.#centreVideo && !this.#centreVideo.paused) this.#centreVideo.pause();
    this.#centreVideo = null;
  }

  /** Attaches the film the first time it is needed (hover-capable devices only) */
  #loadSource(card, video) {
    const src = video.dataset.src;
    if (!src || video.getAttribute('src')) return;
    const seekTime = parseFloat(card?.dataset.seekTime || '1.0');
    video.addEventListener('loadedmetadata', () => {
      if (video.currentTime === 0 && video.paused) video.currentTime = seekTime;
    }, { once: true });
    video.preload = 'auto';
    video.src = src;
    video.classList.add('has-src');
  }

  #attachScrub(card, video) {
    const playhead = document.createElement('span');
    playhead.className = 'reel-playhead';
    playhead.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'reel-playhead__fill';
    playhead.appendChild(fill);
    card.appendChild(playhead);

    const setProgress = (fraction) => {
      fill.style.setProperty('--progress', Math.min(1, Math.max(0, fraction)).toFixed(4));
    };
    const syncFromVideo = () => {
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    video.addEventListener('timeupdate', syncFromVideo);
    video.addEventListener('seeked', syncFromVideo);
    video.addEventListener('loadedmetadata', syncFromVideo);

    let pendingTime = null;
    let rafId = 0;
    card.addEventListener('mousemove', (e) => {
      if (!video.duration || !Number.isFinite(video.duration)) return;
      const rect = card.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setProgress(fraction);
      pendingTime = fraction * video.duration;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        // Skip tiny moves so a still-ish pointer does not hammer the network with seeks
        if (pendingTime !== null && Math.abs(pendingTime - video.currentTime) > 0.25) {
          if (typeof video.fastSeek === 'function') video.fastSeek(pendingTime);
          else video.currentTime = pendingTime;
        }
        pendingTime = null;
      });
    }, { passive: true });
  }
}

/**
 * CinematicOpenerController
 * Coordinates Bang Motion cinematic motion graphics:
 * - Splits the wordmark into letters for a staggered rise (CSS) with a vertical
 *   SVG motion blur tweened 30 -> 0 during the move, then removed
 * - 24fps viewfinder timecode from 01:00:00:00; freezes while the loop is paused
 *   and stops its rAF while the hero is off screen
 * - Micro-depth camera parallax on fine-pointer desktops (individual `translate`)
 * - Reduced-motion safety
 */
class CinematicOpenerController {
  #timecodeEl;
  #heroEl;
  #wordmarkEl;
  #blurNode;
  #rafId;
  #lastNow;
  #elapsedMs;
  #heroVisible;
  #heroObserver;
  #classObserver;
  #blurRafId;
  #isReducedMotion;
  #driftRenderer = null;

  constructor(options = {}) {
    this.options = Object.assign({
      timecodeSelector: '#hero-live-timecode, .hero-tc.bl',
      heroSelector: '#hero, .hero',
      wordmarkSelector: '.kinetic-wordmark',
      blurFilterSelector: '#motion-blur-vert feGaussianBlur',
      fps: 24,
      startHour: 1,               // broadcast convention: picture starts at 01:00:00:00
      pausedClass: 'hero--loop-paused',
      blurDelayMs: 350,           // matches the first letter's transition-delay
      blurDurationMs: 1000,
      blurFrom: 30,
      parallaxPx: 8
    }, options);

    this.#timecodeEl = document.querySelector(this.options.timecodeSelector);
    this.#heroEl = document.querySelector(this.options.heroSelector);
    this.#wordmarkEl = document.querySelector(this.options.wordmarkSelector);
    this.#blurNode = document.querySelector(this.options.blurFilterSelector);
    this.#rafId = null;
    this.#lastNow = null;
    this.#elapsedMs = 0;
    this.#heroVisible = true;
    this.#heroObserver = null;
    this.#classObserver = null;
    this.#blurRafId = null;
    this.#isReducedMotion = false;

    this.tick = this.tick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    this.init();
  }

  init() {
    this.#isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.#splitWordmark();

    // Wordmark blur follows the letters' entrance, then is removed (re-rasterising every frame is costly)
    if (this.#wordmarkEl && this.#blurNode && !this.#isReducedMotion) {
      this.#wordmarkEl.style.filter = 'url(#motion-blur-vert)';
      this.#onReveal(() => this.#runBlurTween());
    }

    // 24 fps viewfinder timecode: only advances while the hero is on screen and recording
    if (this.#timecodeEl) {
      this.#renderTimecode();
      if ('IntersectionObserver' in window && this.#heroEl) {
        this.#heroObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.#heroVisible = entry.isIntersecting;
            if (this.#heroVisible) this.#startClock();
            else this.#stopClock();
          });
        }, { threshold: 0 });
        this.#heroObserver.observe(this.#heroEl);
      } else {
        this.#startClock();
      }
    }

    // Micro-depth camera parallax on desktop viewports
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsHover && !this.#isReducedMotion && this.#heroEl) {
      window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    }
  }

  /** Wrap each letter so CSS can stagger them; words stay unbreakable, the space stays a real space */
  #splitWordmark() {
    const el = this.#wordmarkEl;
    if (!el || el.dataset.split === 'true') return;
    const text = el.textContent.trim();
    const heading = el.closest('h1, h2');
    if (heading && !heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', text);
    el.setAttribute('aria-hidden', 'true');

    let index = 0;
    const fragment = document.createDocumentFragment();
    text.split(' ').forEach((word, wordIndex) => {
      if (wordIndex > 0) fragment.appendChild(document.createTextNode(' '));
      const wordEl = document.createElement('span');
      wordEl.className = 'kinetic-word';
      for (const char of word) {
        const letter = document.createElement('span');
        letter.className = 'kinetic-letter';
        letter.style.setProperty('--i', String(index++));
        letter.textContent = char;
        wordEl.appendChild(letter);
      }
      fragment.appendChild(wordEl);
    });
    el.replaceChildren(fragment);
    el.dataset.split = 'true';
  }

  #onReveal(callback) {
    if (!this.#heroEl) return;
    if (this.#heroEl.classList.contains('revealed')) {
      callback();
      return;
    }
    this.#classObserver = new MutationObserver(() => {
      if (this.#heroEl.classList.contains('revealed')) {
        this.#classObserver.disconnect();
        this.#classObserver = null;
        callback();
      }
    });
    this.#classObserver.observe(this.#heroEl, { attributes: true, attributeFilter: ['class'] });
  }

  #runBlurTween() {
    const { blurDelayMs, blurDurationMs, blurFrom } = this.options;
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, Math.max(0, (now - start - blurDelayMs) / blurDurationMs));
      const eased = 1 - Math.pow(1 - t, 4); // power4.out, same feel as the letters' curve
      const v = blurFrom * (1 - eased);
      this.#blurNode.setAttribute('stdDeviation', `0 ${v.toFixed(2)}`);
      if (t < 1) {
        this.#blurRafId = window.requestAnimationFrame(step);
      } else {
        this.#wordmarkEl.style.filter = 'none';
        this.#blurRafId = null;
      }
    };
    this.#blurNode.setAttribute('stdDeviation', `0 ${blurFrom}`);
    this.#blurRafId = window.requestAnimationFrame(step);
  }

  #startClock() {
    if (this.#rafId) return;
    this.#lastNow = null;
    this.#rafId = window.requestAnimationFrame(this.tick);
  }

  #stopClock() {
    if (this.#rafId) window.cancelAnimationFrame(this.#rafId);
    this.#rafId = null;
    this.#lastNow = null;
  }

  #renderTimecode() {
    const { fps, startHour } = this.options;
    const totalFrames = Math.floor((this.#elapsedMs / 1000) * fps);
    const ff = String(totalFrames % fps).padStart(2, '0');
    const ss = String(Math.floor(totalFrames / fps) % 60).padStart(2, '0');
    const mm = String(Math.floor(totalFrames / (fps * 60)) % 60).padStart(2, '0');
    const hh = String((startHour + Math.floor(totalFrames / (fps * 3600))) % 24).padStart(2, '0');
    this.#timecodeEl.textContent = `${hh}:${mm}:${ss}:${ff}`;
  }

  tick(now) {
    // The camera only "records" while the loop plays: paused loop or reduced motion freezes the clock
    const recording = !this.#heroEl?.classList.contains(this.options.pausedClass);
    if (this.#lastNow !== null && recording) {
      this.#elapsedMs += now - this.#lastNow;
      this.#renderTimecode();
    }
    this.#lastNow = now;
    this.#rafId = window.requestAnimationFrame(this.tick);
  }

  handleMouseMove(e) {
    if (!this.#heroEl || this.#isReducedMotion || !this.#heroVisible) return;

    const normX = (e.clientX / window.innerWidth) - 0.5;
    const normY = (e.clientY / window.innerHeight) - 0.5;
    const px = this.options.parallaxPx;

    if (this.#driftRenderer) {
      this.#driftRenderer(normX * px, normY * px);
      return;
    }

    const inner = this.#heroEl.querySelector('.hero-inner');
    if (inner) {
      // Individual `translate` composes with the entrance `transform` instead of overwriting it
      inner.style.translate = `${(normX * px).toFixed(2)}px ${(normY * px).toFixed(2)}px`;
    }
  }

  /** Lets ScrollMotionController ease the pointer drift; pass null to go back to the CSS transition */
  setDriftRenderer(renderer) {
    this.#driftRenderer = typeof renderer === 'function' ? renderer : null;
  }

  destroy() {
    this.#stopClock();
    if (this.#blurRafId) window.cancelAnimationFrame(this.#blurRafId);
    this.#heroObserver?.disconnect();
    this.#classObserver?.disconnect();
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}

/**
 * HeroLoopController
 * Owns the Pause / Play control for the hero's background motion (the drift wall).
 * WCAG 2.2.2: moving content longer than 5s must be pausable. The control toggles
 * `hero--loop-paused` on the hero; DriftWallController and the viewfinder timecode follow it.
 * Reduced motion and data-saver start paused; Play opts in.
 */
class HeroLoopController {
  #heroEl;
  #toggleBtn;
  #label;
  #userPaused;

  constructor(options = {}) {
    this.options = Object.assign({
      heroSelector: '#hero',
      toggleSelector: '#hero-loop-toggle',
      pausedClass: 'hero--loop-paused'
    }, options);

    this.#heroEl = document.querySelector(this.options.heroSelector);
    this.#toggleBtn = document.querySelector(this.options.toggleSelector);
    this.#label = this.#toggleBtn?.querySelector('.hero__loop-label') || null;
    this.#userPaused = false;

    this.handleToggleClick = this.handleToggleClick.bind(this);

    this.init();
  }

  get isPaused() {
    return this.#userPaused;
  }

  init() {
    if (!this.#heroEl) return;
    this.#userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || navigator.connection?.saveData === true;
    this.#toggleBtn?.addEventListener('click', this.handleToggleClick);
    this.#syncUi();
  }

  handleToggleClick() {
    this.#userPaused = !this.#userPaused;
    this.#syncUi();
  }

  #syncUi() {
    this.#heroEl.classList.toggle(this.options.pausedClass, this.#userPaused);
    if (this.#toggleBtn) {
      this.#toggleBtn.setAttribute('aria-label', this.#userPaused ? 'Play background motion' : 'Pause background motion');
    }
    if (this.#label) {
      this.#label.textContent = this.#userPaused ? 'Play' : 'Pause';
    }
  }

  destroy() {
    this.#toggleBtn?.removeEventListener('click', this.handleToggleClick);
  }
}

/**
 * DriftWallController
 * The reel's stills drift in slow columns on a tilted plane behind the hero title.
 * Vanilla port of the React Bits "DriftWall" component, copyright (c) 2026 David Haz,
 * MIT + Commons Clause (full notice: licenses/react-bits-LICENSE.md).
 * Adapted for this site: tiles are the film stills (repeated, since there are few),
 * not links and not focusable; 2px radius and brand tint come from style.css;
 * pointer tilt only on fine pointers. The drift glides to a stop with the hero
 * Pause button (WCAG 2.2.2), and stops off screen and in a hidden tab.
 * Reduced motion: the hero starts paused, so the wall rests still (Play opts in);
 * the pointer tilt stays off.
 */
class DriftWallController {
  #root;
  #hero;
  #plane;
  #tracks;
  #columns;
  #offsets;
  #velocities;
  #pointer;
  #damped;
  #rafId;
  #lastTs;
  #visible;
  #isReducedMotion;
  #observer;
  #classObserver;
  #resizeObserver;
  #resizeTimer;
  #lastSize;

  constructor(options = {}) {
    this.options = Object.assign({
      selector: '[data-drift-wall]',
      heroSelector: '#hero',
      pausedClass: 'hero--loop-paused',
      gap: 14,
      tilt: 16,           // rotateX, degrees
      turn: -14,          // rotateY, degrees
      roll: 0,            // rotateZ, degrees
      depth: 120,         // px the plane sits back
      scale: 1.18,
      speed: 10,          // px per second; columns alternate direction (slow, like the rest of the site)
      variance: 0.45,     // how much column speeds differ (0 to 1)
      parallax: 0.5       // pointer tilt strength (0 disables it)
    }, options);

    this.#root = document.querySelector(this.options.selector);
    this.#hero = document.querySelector(this.options.heroSelector);
    this.#plane = null;
    this.#tracks = [];
    this.#columns = [];
    this.#offsets = [];
    this.#velocities = [];
    this.#pointer = { x: 0, y: 0 };
    this.#damped = { x: 0, y: 0 };
    this.#rafId = null;
    this.#lastTs = null;
    this.#visible = true;
    this.#isReducedMotion = false;
    this.#observer = null;
    this.#classObserver = null;
    this.#resizeObserver = null;
    this.#resizeTimer = null;
    this.#lastSize = '';

    this.tick = this.tick.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);

    this.init();
  }

  init() {
    if (!this.#root) return;
    this.#isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#build();

    if ('IntersectionObserver' in window && this.#hero) {
      this.#observer = new IntersectionObserver((entries) => {
        this.#visible = entries[0].isIntersecting;
        if (this.#visible) this.#wake();
      }, { threshold: 0 });
      this.#observer.observe(this.#hero);
    }

    // The hero Pause button toggles a class; restart the loop so the wall can glide back in
    if (this.#hero) {
      this.#classObserver = new MutationObserver(() => this.#wake());
      this.#classObserver.observe(this.#hero, { attributes: true, attributeFilter: ['class'] });
    }

    if (this.options.parallax > 0 && !this.#isReducedMotion
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('mousemove', this.handlePointerMove, { passive: true });
    }
    document.addEventListener('visibilitychange', this.handleVisibility);

    if ('ResizeObserver' in window) {
      this.#resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(this.#resizeTimer);
        this.#resizeTimer = window.setTimeout(() => this.#build(), 200);
      });
      this.#resizeObserver.observe(this.#root);
    }

    this.#wake();
  }

  /** Tile list from the markup: "name:l name:p ..." (l = landscape 16:10, p = portrait 9:16) */
  #readTiles() {
    const path = this.#root.dataset.tilePath || '';
    return (this.#root.dataset.tiles || '').split(/\s+/).filter(Boolean).map(entry => {
      const [name, shape] = entry.split(':');
      return { src: `${path}${name}.webp`, ratio: shape === 'p' ? 16 / 9 : 10 / 16 };
    });
  }

  #build() {
    const width = this.#root.clientWidth || window.innerWidth;
    const height = this.#root.clientHeight || window.innerHeight;
    const size = `${width}x${height}`;
    if (size === this.#lastSize && this.#plane) return;
    this.#lastSize = size;

    const tiles = this.#readTiles();
    if (!tiles.length) return;

    const { gap } = this.options;
    const tileW = Math.round(Math.min(220, Math.max(120, width * 0.13)));
    const unitW = tileW + gap;
    // The plane is scaled and turned away, so it needs to be wider than the frame to fill it
    const columnCount = Math.max(4, Math.ceil((width * 1.4) / unitW));
    this.#root.style.setProperty('--dw-tile-w', `${tileW}px`);
    this.#root.style.setProperty('--dw-gap', `${gap}px`);

    const plane = document.createElement('div');
    plane.className = 'drift-wall__plane';
    this.#tracks = [];
    this.#columns = [];

    for (let c = 0; c < columnCount; c++) {
      // Each column runs through every still, starting somewhere different, so neighbours differ
      const start = (c * 3) % tiles.length;
      const order = tiles.map((_, i) => tiles[(start + i) % tiles.length]);
      const heights = order.map(tile => Math.round(tileW * tile.ratio) + gap);
      const copyHeight = heights.reduce((sum, h) => sum + h, 0);
      const copies = Math.max(2, Math.ceil((height * 1.8) / copyHeight) + 1);

      const col = document.createElement('div');
      col.className = 'drift-wall__col';
      const track = document.createElement('div');
      track.className = 'drift-wall__track';

      for (let k = 0; k < copies; k++) {
        order.forEach((tile, i) => {
          const cell = document.createElement('div');
          cell.className = 'drift-wall__tile';
          cell.style.height = `${heights[i]}px`;
          const img = document.createElement('img');
          img.src = tile.src;
          img.alt = '';
          img.decoding = 'async';
          img.draggable = false;
          cell.appendChild(img);
          track.appendChild(cell);
        });
      }

      col.appendChild(track);
      plane.appendChild(col);
      this.#tracks.push(track);

      // Columns alternate direction; the golden-ratio spread keeps speeds from lining up
      const spread = ((c * 0.6180339887 + 0.35) % 1) * 2 - 1;
      const sign = c % 2 === 0 ? 1 : -1;
      this.#columns.push({
        copyHeight,
        velocity: this.options.speed * (1 + this.options.variance * spread) * sign
      });
      if (this.#offsets[c] === undefined) this.#offsets[c] = copyHeight * ((c * 0.37) % 1);
      this.#offsets[c] %= copyHeight;
      // A wall that starts paused (reduced motion, data saver) starts still, not gliding to a stop
      if (this.#velocities[c] === undefined) this.#velocities[c] = this.#isPaused() ? 0 : this.#columns[c].velocity;
    }

    this.#root.replaceChildren(plane);
    this.#plane = plane;
    this.#render();
  }

  #isPaused() {
    return !!this.#hero?.classList.contains(this.options.pausedClass);
  }

  #render() {
    if (!this.#plane) return;
    const { tilt, turn, roll, depth, scale } = this.options;
    this.#plane.style.transform =
      `translate(-50%, -50%) scale(${scale}) ` +
      `rotateX(${(tilt + this.#damped.y).toFixed(3)}deg) rotateY(${(turn + this.#damped.x).toFixed(3)}deg) ` +
      `rotateZ(${roll}deg) translateZ(${-depth}px)`;
    this.#tracks.forEach((track, c) => {
      track.style.transform = `translate3d(0, ${(-this.#offsets[c]).toFixed(2)}px, 0)`;
    });
  }

  #wake() {
    if (this.#rafId || !this.#visible || document.hidden) return;
    this.#lastTs = null;
    this.#rafId = window.requestAnimationFrame(this.tick);
  }

  tick(ts) {
    this.#rafId = null;
    if (!this.#visible || document.hidden) return;
    if (this.#lastTs === null) this.#lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, ts - this.#lastTs) / 1000);
    this.#lastTs = ts;

    const paused = this.#isPaused();

    // Pointer tilt, damped
    const maxTilt = this.options.parallax * 8;
    const damp = 1 - Math.exp(-dt / 0.12);
    this.#damped.x += (this.#pointer.x * maxTilt - this.#damped.x) * damp;
    this.#damped.y += (-this.#pointer.y * maxTilt - this.#damped.y) * damp;

    // Drift: velocities ease toward their target, so Pause glides to a stop instead of freezing
    let moving = Math.abs(this.#pointer.x * maxTilt - this.#damped.x) > 0.01
      || Math.abs(-this.#pointer.y * maxTilt - this.#damped.y) > 0.01;
    this.#columns.forEach((col, c) => {
      const target = paused ? 0 : col.velocity;
      const ease = 1 - Math.exp(-dt / (paused ? 0.35 : 0.6));
      this.#velocities[c] += (target - this.#velocities[c]) * ease;
      if (paused && Math.abs(this.#velocities[c]) < 0.5) this.#velocities[c] = 0;
      if (Math.abs(this.#velocities[c]) > 0) moving = true;
      const next = (this.#offsets[c] ?? 0) + this.#velocities[c] * dt;
      this.#offsets[c] = ((next % col.copyHeight) + col.copyHeight) % col.copyHeight;
    });

    this.#render();
    // Paused and settled: stop the loop until something wakes it
    if (!paused || moving) this.#rafId = window.requestAnimationFrame(this.tick);
  }

  handlePointerMove(e) {
    if (!this.#hero || !this.#visible) return;
    const rect = this.#hero.getBoundingClientRect();
    this.#pointer = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5
    };
    this.#wake();
  }

  handleVisibility() {
    if (document.hidden) {
      if (this.#rafId) window.cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    } else {
      this.#wake();
    }
  }

  destroy() {
    if (this.#rafId) window.cancelAnimationFrame(this.#rafId);
    this.#rafId = null;
    window.clearTimeout(this.#resizeTimer);
    this.#observer?.disconnect();
    this.#classObserver?.disconnect();
    this.#resizeObserver?.disconnect();
    window.removeEventListener('mousemove', this.handlePointerMove);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}

/**
 * ScrollMotionController
 * Scroll-linked motion on GSAP + ScrollTrigger (+ SplitText), self-hosted in vendor/gsap.
 * Runs only when GSAP is loaded and the visitor has not asked for reduced motion; it then
 * adds `.gsap-motion` to <html>, which hands the affected properties over in style.css.
 * Without it the CSS versions (and the plain page) stay as they are.
 * - Hero: shutter (bars close, footage pushes in), wordmark opens up, eased pointer drift
 * - About: focus pulled by scroll, portrait drift, bio rises line by line
 * - Section headings: eyebrow rule draws, title rises from a mask
 * - Reel: footage drifts inside each card
 * - Header: page playhead
 * - Footer: closing credits follow the scroll
 */
class ScrollMotionController {
  #opener;
  #mm;

  constructor(opener = null) {
    this.#opener = opener;
    this.#mm = null;
    this.init();
  }

  init() {
    const { gsap, ScrollTrigger, SplitText } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (SplitText) gsap.registerPlugin(SplitText);

    this.#mm = gsap.matchMedia();
    // Everything created in here is reverted by GSAP if the preference flips to "reduce"
    this.#mm.add('(prefers-reduced-motion: no-preference)', () => {
      const root = document.documentElement;
      root.classList.add('gsap-motion');
      const cleanups = [
        this.#hero(gsap, ScrollTrigger),
        this.#about(gsap, SplitText),
        this.#headings(gsap, ScrollTrigger, SplitText),
        this.#reel(gsap, ScrollTrigger),
        this.#playhead(gsap),
        this.#credits(gsap),
        this.#keepMeasured(gsap, ScrollTrigger)
      ];
      return () => {
        cleanups.forEach(fn => fn?.());
        root.classList.remove('gsap-motion');
      };
    });
  }

  #hero(gsap, ScrollTrigger) {
    const hero = document.getElementById('hero');
    if (!hero) return null;
    const bars = hero.querySelectorAll('.letterbox');
    const wall = hero.querySelector('.drift-wall');
    const wordmark = hero.querySelector('.kinetic-wordmark');
    const letters = wordmark ? Array.from(wordmark.querySelectorAll('.kinetic-letter')) : [];

    // Each letter moves out in proportion to its distance from the wordmark's centre.
    // offsetLeft ignores transforms, so this is safe to re-measure mid-scroll.
    const measure = () => {
      if (!wordmark) return;
      const centre = wordmark.offsetLeft + wordmark.offsetWidth / 2;
      letters.forEach(letter => {
        const dx = (letter.offsetLeft + letter.offsetWidth / 2 - centre) * 0.1;
        letter.style.setProperty('--dx', `${dx.toFixed(2)}px`);
      });
    };
    measure();
    ScrollTrigger.addEventListener('refresh', measure);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    if (bars.length) tl.fromTo(bars, { '--shut': 1 }, { '--shut': 6.5, duration: 0.85 }, 0);
    if (wall) tl.fromTo(wall, { '--push': 1 }, { '--push': 1.12, duration: 1 }, 0);
    if (wordmark) tl.fromTo(wordmark, { '--spread': 0 }, { '--spread': 1, duration: 0.85 }, 0);

    // Pointer drift: one reused tween per axis instead of a CSS transition
    const inner = hero.querySelector('.hero-inner');
    if (inner && this.#opener) {
      const pos = { x: 0, y: 0 };
      const render = () => { inner.style.translate = `${pos.x.toFixed(2)}px ${pos.y.toFixed(2)}px`; };
      const xTo = gsap.quickTo(pos, 'x', { duration: 0.9, ease: 'power3.out', onUpdate: render });
      const yTo = gsap.quickTo(pos, 'y', { duration: 0.9, ease: 'power3.out', onUpdate: render });
      this.#opener.setDriftRenderer((x, y) => { xTo(x); yTo(y); });
    }

    return () => {
      ScrollTrigger.removeEventListener('refresh', measure);
      this.#opener?.setDriftRenderer(null);
      letters.forEach(letter => letter.style.removeProperty('--dx'));
      if (inner) inner.style.translate = '';
    };
  }

  #about(gsap, SplitText) {
    const frame = document.querySelector('.about-frame');
    const img = frame?.querySelector('.about-placeholder-img');
    let soft = null;
    if (frame && img) {
      // A blurred copy on top of the sharp portrait; only its opacity is animated
      soft = document.createElement('div');
      soft.className = 'about-focus-soft';
      soft.setAttribute('aria-hidden', 'true');
      const copy = (img.closest('picture') || img).cloneNode(true);
      const copyImg = copy.matches('img') ? copy : copy.querySelector('img');
      if (copyImg) copyImg.alt = '';
      soft.appendChild(copy);
      frame.appendChild(soft);

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: frame, start: 'top 90%', end: 'center 55%', scrub: 0.6 }
      })
        .fromTo(soft, { opacity: 1 }, { opacity: 0 }, 0)
        .fromTo(img, { scale: 1.14 }, { scale: 1.08 }, 0);

      gsap.fromTo(img, { yPercent: -3 }, {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    const bio = document.querySelector('.about-bio');
    if (bio && SplitText) {
      // aria "none": the text stays as real text for screen readers; lines re-split on resize
      SplitText.create(bio, {
        type: 'lines',
        mask: 'lines',
        aria: 'none',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 105,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.09,
          delay: 0.15,
          scrollTrigger: { trigger: bio, start: 'top 88%', once: true }
        })
      });
    }

    return () => soft?.remove();
  }

  #headings(gsap, ScrollTrigger, SplitText) {
    const heads = gsap.utils.toArray('.section-head');
    if (!heads.length) return null;
    const timelines = new Map();

    heads.forEach(head => {
      const eyebrow = head.querySelector('.eyebrow');
      const title = head.querySelector('.section-title');
      const tl = gsap.timeline({ paused: true, delay: 0.15 });
      if (eyebrow) {
        tl.fromTo(eyebrow, { '--rule': 0, opacity: 0 }, { '--rule': 1, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0);
      }
      if (title && SplitText) {
        const split = SplitText.create(title, { type: 'lines', mask: 'lines', aria: 'none' });
        tl.from(split.lines, { yPercent: 110, duration: 0.9, ease: 'expo.out' }, 0.1)
          .add(() => split.revert()); // back to a plain heading once it has landed
      }
      timelines.set(head, tl);
    });

    // Heads that arrive together start together
    ScrollTrigger.batch(heads, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => batch.forEach(head => timelines.get(head)?.play())
    });
    return null;
  }

  #reel(gsap, ScrollTrigger) {
    const grid = document.getElementById('reel-grid');
    gsap.utils.toArray('.reel-card').forEach(card => {
      gsap.fromTo(card, { '--drift': -2.5 }, {
        '--drift': 2.5,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    if (!grid) return null;

    // A filter change re-lays the grid (and the page height); re-measure once the glide has finished
    let pending = null;
    const observer = new MutationObserver(() => {
      pending?.kill();
      pending = gsap.delayedCall(0.7, () => ScrollTrigger.refresh());
    });
    observer.observe(grid, { attributes: true, attributeFilter: ['data-view'] });
    return () => {
      observer.disconnect();
      pending?.kill();
    };
  }

  #playhead(gsap) {
    const header = document.getElementById('site-header');
    if (!header) return null;
    const bar = document.createElement('span');
    bar.className = 'site-header__playhead';
    bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);
    gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
    return () => bar.remove();
  }

  #credits(gsap) {
    const footer = document.querySelector('.site-footer');
    if (!footer) return null;
    const lines = footer.querySelectorAll('.footer-inner .stagger-item');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: footer, start: 'top 80%', end: 'max', scrub: 0.6 }
    });
    tl.fromTo(footer, { '--bars': 0 }, { '--bars': 1, duration: 1 }, 0);
    if (lines.length) {
      tl.fromTo(lines, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.18, ease: 'power2.out' }, 0.05);
    }
    return null;
  }

  /** The page height changes after setup (fonts, split lines, filters); re-measure when it settles */
  #keepMeasured(gsap, ScrollTrigger) {
    if (!('ResizeObserver' in window)) return null;
    let pending = null;
    let lastHeight = document.body.offsetHeight;
    const observer = new ResizeObserver(() => {
      const height = document.body.offsetHeight;
      if (height === lastHeight) return;
      lastHeight = height;
      pending?.kill();
      pending = gsap.delayedCall(0.7, () => ScrollTrigger.refresh());
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      pending?.kill();
    };
  }

  destroy() {
    this.#mm?.revert();
    this.#mm = null;
  }
}

/**
 * PortfolioApp
 * Global coordinator and entry point initialized on DOMContentLoaded.
 */
class PortfolioApp {
  constructor() {
    this.headerNav = null;
    this.reelFilter = null;
    this.seriesRow = null;
    this.videoModal = null;
    this.mediaPreview = null;
    this.opener = null;
    this.heroLoop = null;
    this.driftWall = null;
    this.scrollMotion = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.headerNav = new HeaderNavController();
    this.reelFilter = new ReelFilterController();
    this.seriesRow = new SeriesRowController();
    this.videoModal = new VideoModalPlayerController();
    this.mediaPreview = new MediaPreviewController(this.videoModal);
    this.opener = new CinematicOpenerController();
    this.heroLoop = new HeroLoopController();
    this.driftWall = new DriftWallController();
    this.scrollMotion = new ScrollMotionController(this.opener);

    // Play all: opens the first film in the current view; Up next carries on through the reel
    document.getElementById('reel-play-all')?.addEventListener('click', () => {
      const first = Array.from(document.querySelectorAll('.reel-card'))
        .find(card => card.getBoundingClientRect().width > 0);
      if (first) this.videoModal.open(first);
    });

    this.isInitialized = true;
  }
}

// Self-bootstrapping entry point
const bootstrapApp = () => {
  const app = new PortfolioApp();
  app.init();
  window.__cedirekoApp = app;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

// ---------- Hero load-in (Resilient Multi-Event Trigger) ----------
const revealHero = () => {
  const hero = document.getElementById('hero');
  if (hero && !hero.classList.contains('revealed')) {
    hero.classList.add('revealed');
  }
};

if (document.readyState === 'complete') {
  revealHero();
} else {
  window.addEventListener('load', revealHero);
  // Guarantee hero reveals smoothly within 250ms even if external media delays 'load'
  setTimeout(revealHero, 250);
}

// ---------- Uniform scroll-reveal for every section ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  // threshold 0: a ratio threshold never fires on blocks taller than the
  // viewport allows (e.g. the reel grid in a short landscape window)
  threshold: 0,
  rootMargin: '0px 0px -12% 0px'
});

document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
  revealObserver.observe(el);
});