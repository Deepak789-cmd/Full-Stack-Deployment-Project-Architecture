/**
 * Main Application Module - E-commerce Catalog
 * Initializes and orchestrates all application modules
 */

const App = {
  // Application version
  version: '1.0.0',
  
  // Debug mode
  debug: false,
  
  // Application state
  state: {
    initialized: false,
    loading: false
  },

  /**
   * Initialize the application
   */
  async init() {
    if (this.state.initialized) return;
    
    try {
      this.log('Initializing application...');
      
      // Show loading state
      this.showLoading();
      
      // Initialize modules in order
      await this.initializeModules();
      
      // Setup global event listeners
      this.setupGlobalEvents();
      
      // Mark as initialized
      this.state.initialized = true;
      
      // Hide loading state
      this.hideLoading();
      
      this.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('Failed to initialize application');
    }
  },

  /**
   * Initialize all modules
   */
  async initializeModules() {
    // Initialize cart first (loads from storage)
    Cart.init();
    this.log('Cart module initialized');
    
    // Initialize router (handles page navigation)
    Router.init();
    this.log('Router module initialized');
    
    // Pre-fetch products data for faster navigation
    await API.getProducts();
    this.log('Products data pre-fetched');
  },

  /**
   * Setup global event listeners
   */
  setupGlobalEvents() {
    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', this.handleNewsletter.bind(this));
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Search functionality
    const searchForms = document.querySelectorAll('[data-search-form]');
    searchForms.forEach(form => {
      form.addEventListener('submit', this.handleSearch.bind(this));
    });

    // Scroll to top button
    this.setupScrollToTop();

    // Lazy load images
    Utils.lazyLoadImages();

    // Handle scroll events
    window.addEventListener('scroll', Utils.throttle(() => {
      this.handleScroll();
    }, 100));

    // Handle resize events
    window.addEventListener('resize', Utils.debounce(() => {
      this.handleResize();
    }, 200));

    // Handle keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  },

  /**
   * Handle newsletter form submission
   * @param {Event} e - Submit event
   */
  async handleNewsletter(e) {
    e.preventDefault();
    
    const form = e.target;
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    const email = input.value.trim();
    
    if (!email) {
      Utils.showToast('Please enter your email address', 'error');
      return;
    }
    
    // Disable form during submission
    input.disabled = true;
    button.disabled = true;
    button.textContent = 'Subscribing...';
    
    try {
      await API.subscribeNewsletter(email);
      Utils.showToast('Successfully subscribed to newsletter!', 'success');
      input.value = '';
    } catch (error) {
      Utils.showToast(error.message || 'Failed to subscribe', 'error');
    } finally {
      input.disabled = false;
      button.disabled = false;
      button.textContent = 'Subscribe';
    }
  },

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileNav) {
      mobileNav.classList.toggle('open');
      
      // Update menu button icon
      const isOpen = mobileNav.classList.contains('open');
      if (menuBtn) {
        menuBtn.innerHTML = isOpen
          ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
          : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
      }
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  },

  /**
   * Handle search form submission
   * @param {Event} e - Submit event
   */
  handleSearch(e) {
    e.preventDefault();
    
    const form = e.target;
    const input = form.querySelector('input');
    const query = input.value.trim();
    
    if (query) {
      Router.navigate(`/products?search=${encodeURIComponent(query)}`);
    }
  },

  /**
   * Setup scroll to top button
   */
  setupScrollToTop() {
    // Create button if it doesn't exist
    let scrollBtn = document.querySelector('.scroll-to-top');
    
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-to-top';
      scrollBtn.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
        </svg>
      `;
      scrollBtn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-lg);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
      `;
      
      scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      
      document.body.appendChild(scrollBtn);
    }
  },

  /**
   * Handle scroll events
   */
  handleScroll() {
    const scrollBtn = document.querySelector('.scroll-to-top');
    const header = document.querySelector('.header');
    
    // Show/hide scroll to top button
    if (scrollBtn) {
      const show = window.scrollY > 500;
      scrollBtn.style.opacity = show ? '1' : '0';
      scrollBtn.style.visibility = show ? 'visible' : 'hidden';
    }
    
    // Add shadow to header on scroll
    if (header) {
      header.style.boxShadow = window.scrollY > 0 ? 'var(--shadow-md)' : 'none';
    }
  },

  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      const mobileNav = document.querySelector('.mobile-nav');
      if (mobileNav && mobileNav.classList.contains('open')) {
        this.toggleMobileMenu();
      }
    }
  },

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboard(e) {
    // Escape key
    if (e.key === 'Escape') {
      // Close mobile menu
      const mobileNav = document.querySelector('.mobile-nav');
      if (mobileNav && mobileNav.classList.contains('open')) {
        this.toggleMobileMenu();
      }
      
      // Close cart sidebar
      Cart.closeSidebar();
    }
    
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('#search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
  },

  /**
   * Show loading overlay
   */
  showLoading() {
    this.state.loading = true;
    
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.state.loading = false;
    
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  },

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    Utils.showToast(message, 'error');
  },

  /**
   * Log message (only in debug mode)
   * @param {...any} args - Log arguments
   */
  log(...args) {
    if (this.debug) {
      console.log('[App]', ...args);
    }
  },

  /**
   * Get application info
   * @returns {Object} Application info
   */
  getInfo() {
    return {
      version: this.version,
      initialized: this.state.initialized,
      cartCount: Cart.getCount(),
      currentRoute: Router.currentRoute
    };
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Also handle window load for images and other resources
window.addEventListener('load', () => {
  // Initialize lazy loading for any images not yet loaded
  Utils.lazyLoadImages();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
