/**
 * Router Module - E-commerce Catalog
 * Handles client-side routing for SPA-like navigation
 */

const Router = {
  // Route definitions
  routes: {
    '/': { page: 'index', title: 'Home' },
    '/index': { page: 'index', title: 'Home' },
    '/index.html': { page: 'index', title: 'Home' },
    '/products': { page: 'products', title: 'Products' },
    '/products.html': { page: 'products', title: 'Products' },
    '/product/:slug': { page: 'product', title: 'Product Details' },
    '/product.html': { page: 'product', title: 'Product Details' },
    '/cart': { page: 'cart', title: 'Shopping Cart' },
    '/cart.html': { page: 'cart', title: 'Shopping Cart' },
    '/about': { page: 'about', title: 'About Us' },
    '/about.html': { page: 'about', title: 'About Us' },
    '/contact': { page: 'contact', title: 'Contact' },
    '/contact.html': { page: 'contact', title: 'Contact' }
  },

  // Current route state
  currentRoute: null,
  
  // Route change listeners
  listeners: [],

  /**
   * Initialize router
   */
  init() {
    // Handle initial page load
    this.handleRoute();
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      
      if (link && this.shouldIntercept(link)) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });

    // Update active nav links
    this.updateActiveNav();
  },

  /**
   * Check if link should be intercepted
   * @param {HTMLAnchorElement} link - Link element
   * @returns {boolean} Should intercept
   */
  shouldIntercept(link) {
    // Don't intercept external links
    if (link.hostname !== window.location.hostname) return false;
    
    // Don't intercept links with target="_blank"
    if (link.target === '_blank') return false;
    
    // Don't intercept links with download attribute
    if (link.hasAttribute('download')) return false;
    
    // Don't intercept links with data-no-router attribute
    if (link.hasAttribute('data-no-router')) return false;
    
    // Check if it's a known route
    const href = link.getAttribute('href');
    return this.matchRoute(href) !== null;
  },

  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {boolean} replace - Replace history instead of push
   */
  navigate(path, replace = false) {
    // Normalize path
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Update browser history
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }

    // Handle the route
    this.handleRoute();
  },

  /**
   * Handle current route
   */
  handleRoute() {
    const path = window.location.pathname;
    const route = this.matchRoute(path);
    
    if (route) {
      this.currentRoute = route;
      
      // Update page title
      document.title = `${route.title} | TechStore`;
      
      // Update active navigation
      this.updateActiveNav();
      
      // Notify listeners
      this.notifyListeners(route);
      
      // Execute page-specific initialization
      this.initializePage(route);
    }
  },

  /**
   * Match path to route
   * @param {string} path - URL path
   * @returns {Object|null} Matched route or null
   */
  matchRoute(path) {
    // Remove trailing slash
    path = path.replace(/\/$/, '') || '/';
    
    // Direct match
    if (this.routes[path]) {
      return { ...this.routes[path], params: {}, path };
    }

    // Check for dynamic routes
    for (const [pattern, route] of Object.entries(this.routes)) {
      const params = this.extractParams(pattern, path);
      if (params) {
        return { ...route, params, path };
      }
    }

    return null;
  },

  /**
   * Extract parameters from dynamic route
   * @param {string} pattern - Route pattern
   * @param {string} path - URL path
   * @returns {Object|null} Extracted params or null
   */
  extractParams(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) return null;
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    
    return params;
  },

  /**
   * Initialize page-specific functionality
   * @param {Object} route - Route object
   */
  initializePage(route) {
    // Scroll to top
    window.scrollTo(0, 0);

    // Page-specific initialization
    switch (route.page) {
      case 'index':
        this.initHomePage();
        break;
      case 'products':
        this.initProductsPage();
        break;
      case 'product':
        this.initProductPage(route.params);
        break;
      case 'cart':
        this.initCartPage();
        break;
      case 'about':
        this.initAboutPage();
        break;
      case 'contact':
        this.initContactPage();
        break;
    }
  },

  /**
   * Initialize home page
   */
  async initHomePage() {
    try {
      const featuredProducts = await API.getFeaturedProducts(8);
      const grid = document.querySelector('#featured-products');
      
      if (grid) {
        grid.innerHTML = featuredProducts.map(p => Products.renderProductCard(p)).join('');
      }
    } catch (error) {
      console.error('Error loading home page:', error);
    }
  },

  /**
   * Initialize products page
   */
  initProductsPage() {
    Products.init();
  },

  /**
   * Initialize product detail page
   * @param {Object} params - Route parameters
   */
  async initProductPage(params) {
    try {
      const product = await API.getProductBySlug(params.slug);
      
      if (!product) {
        Utils.showToast('Product not found', 'error');
        this.navigate('/products');
        return;
      }
      
      // Update page title
      document.title = `${product.name} | TechStore`;
      
      // Render product details
      this.renderProductDetails(product);
      
      // Load related products
      const related = await API.getRelatedProducts(product, 4);
      this.renderRelatedProducts(related);
      
    } catch (error) {
      console.error('Error loading product:', error);
    }
  },

  /**
   * Render product details
   * @param {Object} product - Product data
   */
  renderProductDetails(product) {
    const container = document.querySelector('#product-detail');
    if (!container) return;

    const discount = Utils.calculateDiscount(product.originalPrice, product.price);

    container.innerHTML = `
      <div class="product-gallery">
        <img src="${product.images[0]}" alt="${product.name}" class="product-main-image" id="main-image">
        ${product.images.length > 1 ? `
          <div class="product-thumbnails">
            ${product.images.map((img, i) => `
              <img src="${img}" alt="${product.name}" class="product-thumbnail ${i === 0 ? 'active' : ''}" onclick="Router.changeImage('${img}', this)">
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="product-details">
        <span class="product-detail-category">${product.brand} • ${product.category}</span>
        <h1 class="product-detail-title">${product.name}</h1>
        <div class="product-detail-rating">
          <div class="rating-stars">${Utils.generateStars(product.rating)}</div>
          <span class="text-gray-500">${product.rating} (${product.reviews} reviews)</span>
        </div>
        <div class="product-detail-price">
          ${Utils.formatPrice(product.price)}
          ${product.originalPrice ? `
            <span class="price-original text-xl ml-3">${Utils.formatPrice(product.originalPrice)}</span>
            <span class="badge badge-sale ml-3">-${discount}%</span>
          ` : ''}
        </div>
        <p class="product-detail-description">${product.description}</p>
        
        ${product.colors && product.colors.length > 0 ? `
          <div class="product-options">
            <label class="option-label">Color: <span id="selected-color">${product.colors[0]}</span></label>
            <div class="color-options">
              ${product.colors.map((color, i) => `
                <button 
                  class="color-option ${i === 0 ? 'selected' : ''}" 
                  style="background-color: ${Utils.getColorValue(color)}"
                  onclick="Router.selectColor('${color}', this)"
                  title="${color}"
                ></button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="quantity-selector">
          <label class="option-label">Quantity:</label>
          <div class="quantity-control">
            <button onclick="Router.updateQuantity(-1)">−</button>
            <span id="product-quantity">1</span>
            <button onclick="Router.updateQuantity(1)">+</button>
          </div>
          <button class="add-to-cart-btn" onclick="Router.addProductToCart(${product.id})">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Add to Cart
          </button>
          <button class="wishlist-btn" onclick="Products.toggleWishlist(${product.id})">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>
        
        <div class="product-features">
          <h3 class="text-lg font-semibold mb-4">Key Features</h3>
          <div class="features-list">
            ${product.features.map(feature => `
              <div class="feature-item">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${feature}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${product.specifications ? `
          <div class="mt-8 pt-8 border-t border-gray-200">
            <h3 class="text-lg font-semibold mb-4">Specifications</h3>
            <div class="grid grid-cols-2 gap-4">
              ${Object.entries(product.specifications).map(([key, value]) => `
                <div>
                  <span class="text-sm text-gray-500">${key}</span>
                  <p class="font-medium">${value}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Store current product for cart
    this.currentProduct = product;
    this.selectedColor = product.colors ? product.colors[0] : null;
    this.selectedQuantity = 1;
  },

  /**
   * Render related products
   * @param {Array} products - Related products
   */
  renderRelatedProducts(products) {
    const container = document.querySelector('#related-products');
    if (!container || products.length === 0) return;

    container.innerHTML = products.map(p => Products.renderProductCard(p)).join('');
  },

  /**
   * Change main product image
   * @param {string} src - Image source
   * @param {HTMLElement} thumb - Thumbnail element
   */
  changeImage(src, thumb) {
    const mainImage = document.querySelector('#main-image');
    if (mainImage) {
      mainImage.src = src;
    }
    
    document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  },

  /**
   * Select color option
   * @param {string} color - Color name
   * @param {HTMLElement} btn - Button element
   */
  selectColor(color, btn) {
    this.selectedColor = color;
    document.querySelector('#selected-color').textContent = color;
    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  },

  /**
   * Update product quantity
   * @param {number} delta - Quantity change
   */
  updateQuantity(delta) {
    this.selectedQuantity = Math.max(1, (this.selectedQuantity || 1) + delta);
    document.querySelector('#product-quantity').textContent = this.selectedQuantity;
  },

  /**
   * Add current product to cart
   * @param {number} productId - Product ID
   */
  async addProductToCart(productId) {
    const product = await API.getProductById(productId);
    if (product) {
      Cart.addItem(product, this.selectedQuantity || 1, {
        color: this.selectedColor
      });
    }
  },

  /**
   * Initialize cart page
   */
  initCartPage() {
    const container = document.querySelector('#cart-page-content');
    if (!container) return;

    this.renderCartPage(container);
    
    // Subscribe to cart changes
    Cart.subscribe(() => this.renderCartPage(container));
  },

  /**
   * Render cart page content
   * @param {HTMLElement} container - Container element
   */
  renderCartPage(container) {
    if (Cart.items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-20">
          <svg class="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <h2 class="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p class="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <a href="/products" class="btn btn-primary btn-lg">Browse Products</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <h2 class="text-2xl font-semibold mb-6">Shopping Cart (${Cart.getCount()} items)</h2>
          <div class="space-y-4">
            ${Cart.items.map((item, index) => `
              <div class="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
                <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-1">
                  <h3 class="font-semibold">${item.name}</h3>
                  ${item.options.color ? `<p class="text-sm text-gray-500">Color: ${item.options.color}</p>` : ''}
                  <p class="text-lg font-bold mt-2">${Utils.formatPrice(item.price)}</p>
                </div>
                <div class="flex flex-col items-end justify-between">
                  <button onclick="Cart.removeItem(${index})" class="text-gray-400 hover:text-red-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                  <div class="flex items-center gap-2">
                    <button class="w-8 h-8 rounded border flex items-center justify-center" onclick="Cart.decrementQuantity(${index})">−</button>
                    <span class="w-8 text-center">${item.quantity}</span>
                    <button class="w-8 h-8 rounded border flex items-center justify-center" onclick="Cart.incrementQuantity(${index})">+</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
            <div class="space-y-3 mb-6">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span>${Utils.formatPrice(Cart.getSubtotal())}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Shipping</span>
                <span class="text-green-600">Free</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tax (8%)</span>
                <span>${Utils.formatPrice(Cart.getTax())}</span>
              </div>
              <div class="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${Utils.formatPrice(Cart.getTotal())}</span>
              </div>
            </div>
            <button class="btn btn-primary w-full btn-lg" onclick="Cart.checkout()">
              Proceed to Checkout
            </button>
            <a href="/products" class="btn btn-secondary w-full mt-3">Continue Shopping</a>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize about page
   */
  initAboutPage() {
    // Add any about page specific initialization
  },

  /**
   * Initialize contact page
   */
  initContactPage() {
    const form = document.querySelector('#contact-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
          const result = await API.submitContactForm(data);
          Utils.showToast(result.message, 'success');
          form.reset();
        } catch (error) {
          Utils.showToast('Error submitting form', 'error');
        }
      });
    }
  },

  /**
   * Update active navigation links
   */
  updateActiveNav() {
    const path = window.location.pathname;
    
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      const isActive = path === href || 
                       (href !== '/' && path.startsWith(href.replace('.html', '')));
      link.classList.toggle('active', isActive);
    });
  },

  /**
   * Subscribe to route changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  },

  /**
   * Notify listeners of route change
   * @param {Object} route - Current route
   */
  notifyListeners(route) {
    this.listeners.forEach(callback => callback(route));
  },

  /**
   * Get current route parameters
   * @returns {Object} Route parameters
   */
  getParams() {
    return this.currentRoute?.params || {};
  },

  /**
   * Get query parameters
   * @returns {Object} Query parameters
   */
  getQuery() {
    return Utils.parseQueryString(window.location.search);
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
