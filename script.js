(function() {
  'use strict';

  const CONFIG = {
    HEADER_HEIGHT_FALLBACK: 80,
    SCROLL_OFFSET: 80,
    DEBOUNCE_DELAY: 200,
    THROTTLE_LIMIT: 100,
    TOAST_DURATION: 5000,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\d\s\+\-\(\)]{10,20}$/,
    NAME_REGEX: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    MIN_MESSAGE_LENGTH: 10
  };

  const STATE = {
    isMenuOpen: false,
    isFormSubmitting: false,
    scrollPosition: 0
  };

  function debounce(fn, delay) {
    let timer;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    let wait = false;
    return function() {
      if (!wait) {
        fn.apply(this, arguments);
        wait = true;
        setTimeout(function() {
          wait = false;
        }, limit);
      }
    };
  }

  function getHeaderHeight() {
    const header = document.querySelector('.l-header');
    return header ? header.offsetHeight : CONFIG.HEADER_HEIGHT_FALLBACK;
  }

  function initBurgerMenu() {
    const toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    const nav = document.querySelector('.navbar-collapse');
    const body = document.body;

    if (!toggle || !nav) return;

    const focusableSelectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let focusableElements = [];

    function updateFocusableElements() {
      focusableElements = Array.from(nav.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
    }

    function openMenu() {
      STATE.isMenuOpen = true;
      nav.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    function closeMenu() {
      STATE.isMenuOpen = false;
      nav.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
      toggle.focus();
    }

    function trapFocus(e) {
      if (!STATE.isMenuOpen || focusableElements.length === 0) return;
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (STATE.isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && STATE.isMenuOpen) {
        closeMenu();
      }
      if (e.key === 'Tab' && STATE.isMenuOpen) {
        trapFocus(e);
      }
    });

    document.addEventListener('click', function(e) {
      if (STATE.isMenuOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    const navLinks = nav.querySelectorAll('.c-nav__item, .nav-link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (STATE.isMenuOpen) {
          closeMenu();
        }
      });
    });

    const resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && STATE.isMenuOpen) {
        closeMenu();
      }
    }, CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('resize', resizeHandler);
  }

  function initSmoothScroll() {
    document.addEventListener('click', function(e) {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target || target.tagName !== 'A') return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      const path = href.substring(0, hashIndex);
      const hash = href.substring(hashIndex + 1);
      const currentPath = window.location.pathname;
      const isCurrentPage = path === '' || path === currentPath || (path === '/' && (currentPath === '/' || currentPath === '/index.html'));

      if (isCurrentPage && hash) {
        e.preventDefault();
        const targetEl = document.getElementById(hash);
        if (targetEl) {
          const headerHeight = getHeaderHeight();
          const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetTop,
            behavior: 'smooth'
          });
          if (window.history && window.history.pushState) {
            window.history.pushState(null, null, '#' + hash);
          }
        }
      }
    });
  }

  function initActiveMenu() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.c-nav__item, .nav-link');
    const isHomepage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/');

    links.forEach(function(link) {
      const href = link.getAttribute('href') || '';
      const linkPath = href.split('#')[0];
      if (linkPath === currentPath || (isHomepage && (linkPath === '/' || linkPath === '/index.html' || linkPath === ''))) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const navLinks = document.querySelectorAll('.c-nav__item[href^="#"], .nav-link[href^="#"]');
    if (navLinks.length === 0) return;

    function updateActiveSection() {
      const scrollPos = window.pageYOffset + getHeaderHeight() + 50;
      sections.forEach(function(section) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (href === '#' + sectionId) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }

    const scrollHandler = throttle(updateActiveSection, CONFIG.THROTTLE_LIMIT);
    window.addEventListener('scroll', scrollHandler);
  }

  function initScrollToTop() {
    const scrollBtn = document.querySelector('[data-scroll-top]');
    if (!scrollBtn) return;

    function toggleVisibility() {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }

    scrollBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    const scrollHandler = throttle(toggleVisibility, CONFIG.THROTTLE_LIMIT);
    window.addEventListener('scroll', scrollHandler);
    toggleVisibility();
  }

  function createToast(message, type) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:350px;';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
    toast.role = 'alert';
    toast.style.marginBottom = '10px';
    toast.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      });
    }

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 150);
    }, CONFIG.TOAST_DURATION);
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    const name = field.name;

    if (field.hasAttribute('required') && value === '') {
      return 'This field is required';
    }

    if (type === 'email' && value !== '' && !CONFIG.EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address';
    }

    if (type === 'tel' && value !== '' && !CONFIG.PHONE_REGEX.test(value)) {
      return 'Please enter a valid phone number (10-20 digits)';
    }

    if ((id === 'firstName' || id === 'lastName' || id === 'name') && value !== '' && !CONFIG.NAME_REGEX.test(value)) {
      return 'Please enter a valid name (2-50 characters, letters only)';
    }

    if (field.tagName === 'TEXTAREA' && value !== '' && value.length < CONFIG.MIN_MESSAGE_LENGTH) {
      return 'Message must be at least ' + CONFIG.MIN_MESSAGE_LENGTH + ' characters';
    }

    if (type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      return 'You must accept this to continue';
    }

    return null;
  }

  function showFieldError(field, message) {
    const formGroup = field.closest('.c-form__group, .mb-3, .form-check');
    if (!formGroup) return;

    formGroup.classList.add('has-error');
    let errorEl = formGroup.querySelector('.c-form__error, .invalid-feedback');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'c-form__error invalid-feedback';
      formGroup.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function clearFieldError(field) {
    const formGroup = field.closest('.c-form__group, .mb-3, .form-check');
    if (!formGroup) return;

    formGroup.classList.remove('has-error');
    const errorEl = formGroup.querySelector('.c-form__error, .invalid-feedback');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  function initForms() {
    const forms = document.querySelectorAll('.c-form, form');

    forms.forEach(function(form) {
      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach(function(field) {
        field.addEventListener('blur', function() {
          const error = validateField(field);
          if (error) {
            showFieldError(field, error);
          } else {
            clearFieldError(field);
          }
        });

        field.addEventListener('input', function() {
          clearFieldError(field);
        });
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (STATE.isFormSubmitting) return;

        const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
        let hasErrors = false;
        let firstErrorField = null;

        fields.forEach(function(field) {
          const error = validateField(field);
          if (error) {
            showFieldError(field, error);
            hasErrors = true;
            if (!firstErrorField) {
              firstErrorField = field;
            }
          } else {
            clearFieldError(field);
          }
        });

        if (hasErrors) {
          createToast('Please correct the errors in the form', 'danger');
          if (firstErrorField) {
            firstErrorField.focus();
          }
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
        }

        STATE.isFormSubmitting = true;

        setTimeout(function() {
          STATE.isFormSubmitting = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
          createToast('Thank you! Your form has been submitted successfully.', 'success');
          setTimeout(function() {
            window.location.href = 'thank_you.html';
          }, 1000);
        }, 1500);
      });
    });
  }

  function initAccordion() {
    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        const target = button.getAttribute('data-bs-target');
        if (!target) return;

        const collapse = document.querySelector(target);
        if (!collapse) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          button.classList.add('collapsed');
          collapse.classList.remove('show');
        } else {
          button.setAttribute('aria-expanded', 'true');
          button.classList.remove('collapsed');
          collapse.classList.add('show');
        }
      });
    });
  }

  function initImages() {
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }
      img.addEventListener('error', function() {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = 'true';
        const svg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="18"%3EImage not available%3C/text%3E%3C/svg%3E';
        img.src = svg;
        img.style.objectFit = 'contain';
      });
    });
  }

  function initHeaderScroll() {
    const header = document.querySelector('.l-header');
    if (!header) return;

    const scrollHandler = throttle(function() {
      STATE.scrollPosition = window.pageYOffset;
      if (STATE.scrollPosition > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, CONFIG.THROTTLE_LIMIT);

    window.addEventListener('scroll', scrollHandler);
    scrollHandler();
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initActiveMenu();
    initScrollSpy();
    initScrollToTop();
    initForms();
    initAccordion();
    initImages();
    initHeaderScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();