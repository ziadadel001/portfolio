/**
 * ZIAD ADEL — "Console" portfolio
 * Hand-written vanilla JS. No framework, no dependencies.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Top bar: stuck state + progress ---------- */
  var topbar = document.getElementById('topbar');
  var progressBar = document.querySelector('.progress span');
  var backToTop = document.getElementById('back-to-top');

  function onScroll() {
    var y = window.scrollY;
    topbar.classList.toggle('is-stuck', y > 20);
    backToTop.classList.toggle('is-visible', y > 500);
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    progressBar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Cairo clock ---------- */
  var clock = document.getElementById('clock');
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo' });
    } catch (e) { fmt = null; }
    var tick = function () { if (fmt) clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Typed command ---------- */
  var typed = document.querySelector('.typed');
  if (typed) {
    var text = typed.getAttribute('data-text') || '';
    if (reduceMotion) {
      typed.textContent = text;
    } else {
      var i = 0;
      var step = function () {
        typed.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 90 + Math.random() * 60);
      };
      setTimeout(step, 400);
    }
  }

  /* ---------- Reveals ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Scroll-spy ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var spyTargets = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && spyTargets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    spyTargets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');
  var menuOpen = false;
  var lastFocused = null;

  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('i').className = open ? 'bi bi-x-lg' : 'bi bi-list';
    if (open) {
      lastFocused = document.activeElement;
      var first = menu.querySelector('a');
      if (first) first.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menuOpen); });

    // The toggle disappears at >820px; never leave the overlay orphaned open
    var desktopMq = window.matchMedia('(min-width: 821px)');
    var onMqChange = function (e) { if (e.matches && menuOpen) setMenu(false); };
    if (desktopMq.addEventListener) desktopMq.addEventListener('change', onMqChange);
    else desktopMq.addListener(onMqChange);

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key !== 'Tab') return;
      var focusables = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a, button')));
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Contact form: progressive enhancement ---------- */
  var form = document.getElementById('contact-form');
  if (form && window.fetch) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      status.className = 'form-status';
      status.removeAttribute('role');
      status.textContent = '→ sending request…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          var success = document.createElement('div');
          success.className = 'form-success';
          success.setAttribute('role', 'status');
          success.innerHTML =
            '<i class="bi bi-check2-circle" aria-hidden="true"></i>' +
            '<p><strong>201 Created — message sent.</strong><br>Thanks for reaching out. I usually reply within a day.</p>';
          form.replaceWith(success);
          success.tabIndex = -1;
          success.focus();
        } else {
          return res.json().then(function (data) {
            var msg = (data && data.errors && data.errors.length)
              ? data.errors.map(function (err) { return err.message; }).join(', ')
              : 'Something went wrong. Please email me directly instead.';
            status.className = 'form-status is-error';
            status.setAttribute('role', 'alert');
            status.textContent = msg;
            btn.disabled = false;
          });
        }
      }).catch(function () {
        status.className = 'form-status is-error';
        status.setAttribute('role', 'alert');
        status.textContent = 'Network error — please try again, or email me directly.';
        btn.disabled = false;
      });
    });
  }

})();
