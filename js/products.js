/**
 * Products Module - E-commerce Catalog
 * Handles product listing and filtering functionality
 */

const Products = {
  // Current filter state
  filters: {
    category: null,
    brand: null,
    minPrice: 0,
    maxPrice: Infinity,
    search: '',
    sort: 'featured',
    page: 1,
    perPage: 12
  },

  /**
   * Initialize products page
   */
  async init() {
    await this.loadFilters();
    await this.loadProducts();
    this.bindEvents();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search input
    const searchInput = document.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.filters.search = e.target.value;
        this.filters.page = 1;
        this.loadProducts();
      }, 300));
    }

    // Sort dropdown
    const sortSelect = document.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.filters.page = 1;
        this.loadProducts();
      });
    }

    // Category filters
    document.querySelectorAll('[data-category-filter]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.filters.category = e.target.checked ? e.target.value : null;
        this.filters.page = 1;
        this.loadProducts();
      });
    });

    // Brand filters
    document.querySelectorAll('[data-brand-filter]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.filters.brand = e.target.checked ? e.target.value : null;
        this.filters.page = 1;
        this.loadProducts();
      });
    });

    // Price range
    const priceSlider = document.querySelector('#price-range');
    if (priceSlider) {
      priceSlider.addEventListener('input', Utils.debounce((e) => {
        this.filters.maxPrice = parseInt(e.target.value);
        this.updatePriceDisplay();
        this.filters.page = 1;
        this.loadProducts();
      }, 300));
    }

    // Clear filters button
    const clearBtn = document.querySelector('#clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  },

  /**
   * Load filter options from API
   */
  async loadFilters() {
    try {
      const [categories, brands, priceRange] = await Promise.all([
        API.getCategories(),
        API.getBrands(),
        API.getPriceRange()
      ]);

      this.renderCategoryFilters(categories);
      this.renderBrandFilters(brands);
      this.renderPriceFilter(priceRange);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  },

  /**
   * Render category filter options
   * @param {Array} categories - Categories array
   */
  renderCategoryFilters(categories) {
    const container = document.querySelector('#category-filters');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <label class="filter-option">
        <input type="checkbox" value="${cat.id}" data-category-filter>
        <span>${cat.name}</span>
      </label>
    `).join('');

    // Rebind events
    container.querySelectorAll('[data-category-filter]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.filters.category = e.target.checked ? e.target.value : null;
        this.filters.page = 1;
        this.loadProducts();
      });
    });
  },

  /**
   * Render brand filter options
   * @param {Array} brands - Brands array
   */
  renderBrandFilters(brands) {
    const container = document.querySelector('#brand-filters');
    if (!container) return;

    container.innerHTML = brands.map(brand => `
      <label class="filter-option">
        <input type="checkbox" value="${brand}" data-brand-filter>
        <span>${brand}</span>
      </label>
    `).join('');

    // Rebind events
    container.querySelectorAll('[data-brand-filter]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.filters.brand = e.target.checked ? e.target.value : null;
        this.filters.page = 1;
        this.loadProducts();
      });
    });
  },

  /**
   * Render price range filter
   * @param {Object} priceRange - Min and max prices
   */
  renderPriceFilter(priceRange) {
    const container = document.querySelector('#price-filter');
    if (!container) return;

    this.filters.maxPrice = priceRange.max;

    container.innerHTML = `
      <input 
        type="range" 
        id="price-range"
        class="price-slider"
        min="${priceRange.min}"
        max="${priceRange.max}"
        value="${priceRange.max}"
        step="10"
      >
      <div class="price-values">
        <span>${Utils.formatPrice(priceRange.min)}</span>
        <span id="max-price-display">${Utils.formatPrice(priceRange.max)}</span>
      </div>
    `;

    // Bind event
    const slider = container.querySelector('#price-range');
    slider.addEventListener('input', Utils.debounce((e) => {
      this.filters.maxPrice = parseInt(e.target.value);
      this.updatePriceDisplay();
      this.filters.page = 1;
      this.loadProducts();
    }, 300));
  },

  /**
   * Update price display
   */
  updatePriceDisplay() {
    const display = document.querySelector('#max-price-display');
    if (display) {
      display.textContent = Utils.formatPrice(this.filters.maxPrice);
    }
  },

  /**
   * Load and render products
   */
  async loadProducts() {
    const grid = document.querySelector('#products-grid');
    const resultsCount = document.querySelector('#results-count');
    
    if (!grid) return;

    // Show loading state
    grid.innerHTML = this.renderLoadingState();

    try {
      const result = await API.filterProducts(this.filters);
      
      // Update results count
      if (resultsCount) {
        resultsCount.textContent = `${result.pagination.total} products`;
      }

      // Render products
      if (result.products.length === 0) {
        grid.innerHTML = this.renderEmptyState();
      } else {
        grid.innerHTML = result.products.map(p => this.renderProductCard(p)).join('');
      }

      // Render pagination
      this.renderPagination(result.pagination);

      // Initialize lazy loading
      Utils.lazyLoadImages();

    } catch (error) {
      console.error('Error loading products:', error);
      grid.innerHTML = this.renderErrorState();
    }
  },

  /**
   * Render single product card
   * @param {Object} product - Product data
   * @returns {string} HTML string
   */
  renderProductCard(product) {
    const discount = Utils.calculateDiscount(product.originalPrice, product.price);
    
    return `
      <article class="product-card" onclick="Router.navigate('/product/${product.slug}')">
        <div class="product-image-container">
          <img 
            src="${product.thumbnail}" 
            alt="${product.name}"
            class="product-image"
            loading="lazy"
          >
          <div class="product-badges">
            ${product.new ? '<span class="badge badge-new">New</span>' : ''}
            ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="product-action-btn" onclick="event.stopPropagation(); Products.quickView(${product.id})" title="Quick View">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <button class="product-action-btn" onclick="event.stopPropagation(); Products.addToCart(${product.id})" title="Add to Cart">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </button>
            <button class="product-action-btn" onclick="event.stopPropagation(); Products.toggleWishlist(${product.id})" title="Add to Wishlist">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <div class="rating-stars">
              ${Utils.generateStars(product.rating)}
            </div>
            <span class="rating-count">(${product.reviews})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${Utils.formatPrice(product.price)}</span>
            ${product.originalPrice ? `<span class="price-original">${Utils.formatPrice(product.originalPrice)}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  /**
   * Render loading state
   * @returns {string} HTML string
   */
  renderLoadingState() {
    return Array(8).fill().map(() => `
      <div class="product-card animate-pulse">
        <div class="product-image-container bg-gray-200"></div>
        <div class="product-info">
          <div class="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Render empty state
   * @returns {string} HTML string
   */
  renderEmptyState() {
    return `
      <div class="col-span-full text-center py-16">
        <svg class="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
        <p class="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
        <button class="btn btn-primary" onclick="Products.clearFilters()">Clear Filters</button>
      </div>
    `;
  },

  /**
   * Render error state
   * @returns {string} HTML string
   */
  renderErrorState() {
    return `
      <div class="col-span-full text-center py-16">
        <svg class="w-20 h-20 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Error loading products</h3>
        <p class="text-gray-500 mb-6">Please try again later</p>
        <button class="btn btn-primary" onclick="Products.loadProducts()">Retry</button>
      </div>
    `;
  },

  /**
   * Render pagination
   * @param {Object} pagination - Pagination data
   */
  renderPagination(pagination) {
    const container = document.querySelector('#pagination');
    if (!container || pagination.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    const pages = this.generatePageNumbers(pagination.page, pagination.totalPages);
    
    container.innerHTML = `
      <button 
        class="pagination-btn" 
        onclick="Products.goToPage(${pagination.page - 1})"
        ${!pagination.hasPrev ? 'disabled' : ''}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      ${pages.map(page => 
        page === '...' 
          ? '<span class="pagination-btn">...</span>'
          : `<button class="pagination-btn ${page === pagination.page ? 'active' : ''}" onclick="Products.goToPage(${page})">${page}</button>`
      ).join('')}
      <button 
        class="pagination-btn" 
        onclick="Products.goToPage(${pagination.page + 1})"
        ${!pagination.hasNext ? 'disabled' : ''}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    `;
  },

  /**
   * Generate page numbers for pagination
   * @param {number} current - Current page
   * @param {number} total - Total pages
   * @returns {Array} Page numbers array
   */
  generatePageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return pages;
  },

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  goToPage(page) {
    this.filters.page = page;
    this.loadProducts();
    Utils.scrollTo('.products-section');
  },

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      category: null,
      brand: null,
      minPrice: 0,
      maxPrice: Infinity,
      search: '',
      sort: 'featured',
      page: 1,
      perPage: 12
    };

    // Reset UI
    document.querySelectorAll('[data-category-filter], [data-brand-filter]').forEach(el => {
      el.checked = false;
    });

    const searchInput = document.querySelector('#search-input');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.querySelector('#sort-select');
    if (sortSelect) sortSelect.value = 'featured';

    this.loadFilters();
    this.loadProducts();
  },

  /**
   * Quick add to cart
   * @param {number} productId - Product ID
   */
  async addToCart(productId) {
    try {
      const product = await API.getProductById(productId);
      if (product) {
        Cart.addItem(product);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Utils.showToast('Error adding to cart', 'error');
    }
  },

  /**
   * Quick view modal
   * @param {number} productId - Product ID
   */
  async quickView(productId) {
    // For simplicity, navigate to product page
    // In a full implementation, this would open a modal
    const product = await API.getProductById(productId);
    if (product) {
      Router.navigate(`/product/${product.slug}`);
    }
  },

  /**
   * Toggle wishlist
   * @param {number} productId - Product ID
   */
  toggleWishlist(productId) {
    const wishlist = Utils.storage.get('wishlist', []);
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
      wishlist.splice(index, 1);
      Utils.showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId);
      Utils.showToast('Added to wishlist', 'success');
    }
    
    Utils.storage.set('wishlist', wishlist);
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Products;
}
