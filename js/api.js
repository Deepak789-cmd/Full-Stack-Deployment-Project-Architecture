/**
 * API Module - E-commerce Catalog
 * Handles data fetching and API interactions
 */

const API = {
  // Base path for data files
  basePath: './data',
  
  // Cache for storing fetched data
  cache: new Map(),
  
  // Cache duration in milliseconds (5 minutes)
  cacheDuration: 5 * 60 * 1000,

  /**
   * Fetch products data
   * @returns {Promise<Object>} Products data
   */
  async getProducts() {
    return this.fetchWithCache('products', `${this.basePath}/products.json`);
  },

  /**
   * Get single product by ID
   * @param {number|string} id - Product ID
   * @returns {Promise<Object|null>} Product data or null
   */
  async getProductById(id) {
    const data = await this.getProducts();
    return data.products.find(p => p.id === parseInt(id)) || null;
  },

  /**
   * Get product by slug
   * @param {string} slug - Product slug
   * @returns {Promise<Object|null>} Product data or null
   */
  async getProductBySlug(slug) {
    const data = await this.getProducts();
    return data.products.find(p => p.slug === slug) || null;
  },

  /**
   * Get products by category
   * @param {string} category - Category ID
   * @returns {Promise<Array>} Array of products
   */
  async getProductsByCategory(category) {
    const data = await this.getProducts();
    return data.products.filter(p => p.category === category);
  },

  /**
   * Get featured products
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Array of featured products
   */
  async getFeaturedProducts(limit = 8) {
    const data = await this.getProducts();
    return data.products.filter(p => p.featured).slice(0, limit);
  },

  /**
   * Get new products
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Array of new products
   */
  async getNewProducts(limit = 4) {
    const data = await this.getProducts();
    return data.products.filter(p => p.new).slice(0, limit);
  },

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    const data = await this.getProducts();
    return data.categories || [];
  },

  /**
   * Get all brands
   * @returns {Promise<Array>} Array of brand names
   */
  async getBrands() {
    const data = await this.getProducts();
    return data.brands || [];
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching products
   */
  async searchProducts(query) {
    const data = await this.getProducts();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return data.products;
    
    return data.products.filter(product => {
      const searchableFields = [
        product.name,
        product.description,
        product.category,
        product.brand,
        ...(product.tags || [])
      ].join(' ').toLowerCase();
      
      return searchableFields.includes(searchTerm);
    });
  },

  /**
   * Filter and sort products
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Filtered products with metadata
   */
  async filterProducts(options = {}) {
    const {
      category = null,
      brand = null,
      minPrice = 0,
      maxPrice = Infinity,
      search = '',
      sort = 'featured',
      page = 1,
      perPage = 12
    } = options;

    const data = await this.getProducts();
    let products = [...data.products];

    // Apply filters
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (brand) {
      products = products.filter(p => p.brand === brand);
    }
    
    if (minPrice > 0 || maxPrice < Infinity) {
      products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm)))
      );
    }

    // Apply sorting
    products = this.sortProducts(products, sort);

    // Calculate pagination
    const total = products.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const paginatedProducts = products.slice(startIndex, startIndex + perPage);

    return {
      products: paginatedProducts,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  /**
   * Sort products
   * @param {Array} products - Products array
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted products
   */
  sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
      case 'featured':
      default:
        return sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  },

  /**
   * Get related products
   * @param {Object} product - Current product
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Array of related products
   */
  async getRelatedProducts(product, limit = 4) {
    const data = await this.getProducts();
    
    return data.products
      .filter(p => 
        p.id !== product.id && 
        (p.category === product.category || p.brand === product.brand)
      )
      .slice(0, limit);
  },

  /**
   * Fetch data with caching
   * @param {string} key - Cache key
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} Fetched data
   */
  async fetchWithCache(key, url) {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Returning stale cached data');
        return cached.data;
      }
      
      throw error;
    }
  },

  /**
   * Clear cache
   * @param {string} key - Specific key to clear (optional)
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  },

  /**
   * Get price range for filters
   * @returns {Promise<Object>} Min and max prices
   */
  async getPriceRange() {
    const data = await this.getProducts();
    const prices = data.products.map(p => p.price);
    
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  },

  /**
   * Simulate newsletter subscription
   * @param {string} email - Email address
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeNewsletter(email) {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Utils.isValidEmail(email)) {
          resolve({ success: true, message: 'Successfully subscribed!' });
        } else {
          reject({ success: false, message: 'Invalid email address' });
        }
      }, 500);
    });
  },

  /**
   * Simulate contact form submission
   * @param {Object} formData - Form data
   * @returns {Promise<Object>} Submission result
   */
  async submitContactForm(formData) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          message: 'Thank you for your message! We\'ll get back to you soon.' 
        });
      }, 1000);
    });
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
