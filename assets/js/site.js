(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileQuery = window.matchMedia('(max-width: 900px)');

  // Skip link: jump to the main content of whichever layout is showing.
  var skip = document.querySelector('.skip-link');
  if (skip) {
    skip.addEventListener('click', function (e) {
      var target = document.getElementById(mobileQuery.matches ? 'main-m' : 'main');
      if (!target) return;
      e.preventDefault();
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView();
    });
  }

  // Mobile menu toggle
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setOpen(menu.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
    mobileQuery.addEventListener('change', function () { setOpen(false); });
  }

  // Links without a destination yet: don't jump to the top of the page.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  // Scroll-reveal: fade + slide up each .reveal element once it enters the viewport.
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  if (reduceMotion || !revealEls.length) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // A rect-based check (rather than relying solely on IntersectionObserver) so that
  // an instant jump — an anchor-link click, or a scrollbar drag that skips a section
  // in one frame — still reveals anything it passed over, not just what eases into view.
  var revealIfPassed = function () {
    var viewportH = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      var rect = el.getBoundingClientRect();
      if (rect.height === 0 && rect.width === 0) return; // in the hidden layout
      if (rect.top < viewportH * 0.92) el.classList.add('is-visible');
    });
  };
  revealIfPassed();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Subtle parallax (desktop only) + reveal catch-up: one update per animation frame.
  var ticking = false;
  var update = function () {
    if (parallaxEls.length && !mobileQuery.matches) {
      var viewportH = window.innerHeight || document.documentElement.clientHeight;
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        var rect = el.getBoundingClientRect();
        var centerOffset = (rect.top + rect.height / 2) - viewportH / 2;
        var offset = Math.max(-80, Math.min(80, centerOffset * speed * -1));
        el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
      });
    }
    revealIfPassed();
    ticking = false;
  };
  var onScroll = function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// Header dropdown (Constellations): keep aria-expanded in sync; Escape closes.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.nav-dropdown'), function (dd) {
    var link = dd.querySelector('.nav-dropdown-link');
    var set = function (open) {
      dd.classList.toggle('is-open', open);
      link.setAttribute('aria-expanded', String(open));
    };
    dd.addEventListener('mouseenter', function () { dd.classList.remove('is-dismissed'); set(true); });
    dd.addEventListener('mouseleave', function () { if (!dd.contains(document.activeElement)) set(false); });
    dd.addEventListener('focusin', function () { set(true); });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) { dd.classList.remove('is-dismissed'); set(false); } });
    dd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { set(false); dd.classList.add('is-dismissed'); link.focus(); }
      if (e.key === 'ArrowDown') {
        var items = dd.querySelectorAll('.nav-dropdown-menu a');
        var i = Array.prototype.indexOf.call(items, document.activeElement);
        if (items[i + 1]) { e.preventDefault(); items[i + 1].focus(); }
      }
      if (e.key === 'ArrowUp') {
        var items2 = dd.querySelectorAll('.nav-dropdown-menu a');
        var j = Array.prototype.indexOf.call(items2, document.activeElement);
        if (j > 0) { e.preventDefault(); items2[j - 1].focus(); } else if (j === 0) { e.preventDefault(); link.focus(); }
      }
    });
  });
})();

// Mobile layout uses "-m" suffixed ids; follow deep links like page.html#hub to the visible copy.
(function () {
  var jump = function () {
    if (!location.hash || !window.matchMedia('(max-width: 900px)').matches) return;
    var id = decodeURIComponent(location.hash.slice(1));
    if (/-m$/.test(id)) return;
    var el = document.getElementById(id + '-m');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  };
  window.addEventListener('load', jump);
  window.addEventListener('hashchange', jump);
})();

// Events page: category filter chips (one set per layout).
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.ev-filters'), function (bar) {
    var scope = bar.parentNode;
    var rows = scope.querySelectorAll('[data-ev-list] .ev-row');
    var empty = scope.querySelector('.ev-empty');
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.ev-filter');
      if (!btn) return;
      var f = btn.getAttribute('data-filter');
      Array.prototype.forEach.call(bar.querySelectorAll('.ev-filter'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      Array.prototype.forEach.call(rows, function (r) {
        var match = f === 'all' || r.getAttribute('data-cat') === f;
        r.hidden = !match;
        if (match) { shown++; r.classList.add('is-visible'); }
      });
      if (empty) empty.hidden = shown > 0;
    });
  });
})();
