/**
 * Cart Module - E-commerce Catalog
 * Handles shopping cart functionality
 */

const Cart = {
  // Storage key for cart data
  storageKey: 'ecommerce_cart',
  
  // Cart items array
  items: [],
  
  // Event listeners
  listeners: [],

  /**
   * Initialize cart from localStorage
   */
  init() {
    this.items = Utils.storage.get(this.storageKey, []);
    this.updateCartUI();
    this.bindEvents();
  },

  /**
   * Bind cart event listeners
   */
  bindEvents() {
    // Cart sidebar toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cart-button') || e.target.closest('[data-cart-toggle]')) {
        e.preventDefault();
        this.toggleSidebar();
      }
      
      if (e.target.closest('.cart-close') || e.target.closest('.cart-overlay')) {
        this.closeSidebar();
      }
    });
    
    // Close cart on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
  },

  /**
   * Add item to cart
   * @param {Object} product - Product to add
   * @param {number} quantity - Quantity to add
   * @param {Object} options - Additional options (color, size, etc.)
   */
  addItem(product, quantity = 1, options = {}) {
    const existingIndex = this.items.findIndex(
      item => item.id === product.id && 
              JSON.stringify(item.options) === JSON.stringify(options)
    );
    
    if (existingIndex > -1) {
      // Update quantity if item exists
      this.items[existingIndex].quantity += quantity;
    } else {
      // Add new item
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.thumbnail || product.images[0],
        quantity,
        options,
        addedAt: Date.now()
      });
    }
    
    this.save();
    this.updateCartUI();
    this.notify('add', product);
    
    Utils.showToast(`${product.name} added to cart!`, 'success');
  },

  /**
   * Remove item from cart
   * @param {number} index - Item index to remove
   */
  removeItem(index) {
    const item = this.items[index];
    this.items.splice(index, 1);
    this.save();
    this.updateCartUI();
    this.notify('remove', item);
    
    Utils.showToast('Item removed from cart', 'info');
  },

  /**
   * Update item quantity
   * @param {number} index - Item index
   * @param {number} quantity - New quantity
   */
  updateQuantity(index, quantity) {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }
    
    this.items[index].quantity = quantity;
    this.save();
    this.updateCartUI();
    this.notify('update', this.items[index]);
  },

  /**
   * Increment item quantity
   * @param {number} index - Item index
   */
  incrementQuantity(index) {
    this.updateQuantity(index, this.items[index].quantity + 1);
  },

  /**
   * Decrement item quantity
   * @param {number} index - Item index
   */
  decrementQuantity(index) {
    this.updateQuantity(index, this.items[index].quantity - 1);
  },

  /**
   * Clear all items from cart
   */
  clear() {
    this.items = [];
    this.save();
    this.updateCartUI();
    this.notify('clear', null);
    
    Utils.showToast('Cart cleared', 'info');
  },

  /**
   * Get cart items count
   * @returns {number} Total items count
   */
  getCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  },

  /**
   * Get cart subtotal
   * @returns {number} Cart subtotal
   */
  getSubtotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  /**
   * Get cart tax (estimated)
   * @param {number} rate - Tax rate (default 8%)
   * @returns {number} Tax amount
   */
  getTax(rate = 0.08) {
    return this.getSubtotal() * rate;
  },

  /**
   * Get cart total
   * @returns {number} Cart total including tax
   */
  getTotal() {
    return this.getSubtotal() + this.getTax();
  },

  /**
   * Save cart to localStorage
   */
  save() {
    Utils.storage.set(this.storageKey, this.items);
  },

  /**
   * Update cart UI elements
   */
  updateCartUI() {
    // Update cart count badges
    const countElements = document.querySelectorAll('.cart-count');
    const count = this.getCount();
    
    countElements.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    
    // Update cart sidebar content
    this.renderCartSidebar();
  },

  /**
   * Render cart sidebar content
   */
  renderCartSidebar() {
    const cartItems = document.querySelector('.cart-items');
    const cartFooter = document.querySelector('.cart-footer');
    
    if (!cartItems) return;
    
    if (this.items.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <p class="text-gray-500 mb-4">Your cart is empty</p>
          <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      
      if (cartFooter) {
        cartFooter.style.display = 'none';
      }
      return;
    }
    
    cartItems.innerHTML = this.items.map((item, index) => `
      <div class="cart-item" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image" loading="lazy">
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-price">${Utils.formatPrice(item.price)}</p>
          ${item.options.color ? `<p class="text-xs text-gray-400">Color: ${item.options.color}</p>` : ''}
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="Cart.decrementQuantity(${index})">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
              </svg>
            </button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="Cart.incrementQuantity(${index})">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem(${index})">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    if (cartFooter) {
      cartFooter.style.display = 'block';
      cartFooter.innerHTML = `
        <div class="cart-subtotal">
          <span class="cart-subtotal-label">Subtotal</span>
          <span class="cart-subtotal-value">${Utils.formatPrice(this.getSubtotal())}</span>
        </div>
        <p class="text-xs text-gray-500 mb-4">Shipping and taxes calculated at checkout</p>
        <button class="cart-checkout-btn" onclick="Cart.checkout()">
          Proceed to Checkout
        </button>
        <button class="btn btn-secondary w-full mt-2" onclick="Cart.clear()">
          Clear Cart
        </button>
      `;
    }
  },

  /**
   * Toggle cart sidebar
   */
  toggleSidebar() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
      document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
  },

  /**
   * Open cart sidebar
   */
  openSidebar() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close cart sidebar
   */
  closeSidebar() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  /**
   * Proceed to checkout
   */
  checkout() {
    if (this.items.length === 0) {
      Utils.showToast('Your cart is empty', 'error');
      return;
    }
    
    // Simulate checkout process
    Utils.showToast('Redirecting to checkout...', 'info');
    
    // In a real app, this would redirect to a checkout page or payment processor
    setTimeout(() => {
      Utils.showToast('Demo mode: Checkout complete!', 'success');
      this.clear();
      this.closeSidebar();
    }, 2000);
  },

  /**
   * Subscribe to cart changes
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
   * Notify subscribers of changes
   * @param {string} action - Action type
   * @param {Object} item - Affected item
   */
  notify(action, item) {
    this.listeners.forEach(callback => {
      callback({ action, item, cart: this.items });
    });
  },

  /**
   * Check if product is in cart
   * @param {number} productId - Product ID
   * @returns {boolean} Is in cart
   */
  isInCart(productId) {
    return this.items.some(item => item.id === productId);
  },

  /**
   * Get item quantity in cart
   * @param {number} productId - Product ID
   * @returns {number} Quantity in cart
   */
  getItemQuantity(productId) {
    const item = this.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cart;
}
