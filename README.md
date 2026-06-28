# 🛒 TechStore - E-commerce Product Catalog

A modern, production-ready e-commerce product catalog built with vanilla HTML, CSS, and JavaScript. Features a modular architecture, client-side routing, responsive design, and optimized performance.

![TechStore Preview](https://images.pexels.com/photos/6803550/pexels-photo-6803550.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=300&w=600)

## ✨ Features

- **🎨 Modern UI/UX** - Clean, professional design with smooth animations
- **📱 Fully Responsive** - Works on all devices from mobile to desktop
- **🛒 Shopping Cart** - Add/remove items, quantity management, persistent storage
- **🔍 Product Search** - Real-time search with filters and sorting
- **⚡ Fast Performance** - Optimized assets, lazy loading, caching
- **🔗 Client-Side Routing** - SPA-like navigation without page reloads
- **♿ Accessible** - Follows WCAG guidelines for accessibility
- **🌙 Dark Mode Ready** - CSS variables for easy theming

## 📁 Project Structure

```
ecommerce-catalog/
│
├── index.html          # Home page
├── products.html       # Product listing page
├── product.html        # Product detail page
├── cart.html           # Shopping cart page
├── about.html          # About us page
├── contact.html        # Contact page
│
├── css/
│   ├── style.css       # Main styles
│   ├── responsive.css  # Responsive breakpoints
│   └── theme.css       # Theme variables
│
├── js/
│   ├── app.js          # Main application logic
│   ├── router.js       # Client-side routing
│   ├── products.js     # Product listing & filtering
│   ├── cart.js         # Shopping cart functionality
│   ├── api.js          # Data fetching & API
│   └── utils.js        # Utility functions
│
├── data/
│   └── products.json   # Product data
│
├── assets/             # Static assets (images, icons, fonts)
│
├── vercel.json         # Vercel deployment config
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (for development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ecommerce-catalog.git
   cd ecommerce-catalog
   ```

2. **Start a local server**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using Node.js (with npx):
   ```bash
   npx serve
   ```
   
   Using VS Code:
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 🌐 Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd ecommerce-catalog
   vercel
   ```

4. **Follow the prompts**
   - Select or create a project
   - Choose default settings
   - Wait for deployment to complete

5. **Your site is live!**
   ```
   https://your-project.vercel.app
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ecommerce-catalog.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Automatic deployments**
   - Every push to `main` will trigger a new deployment
   - Pull requests get preview deployments

### Method 3: Drag and Drop

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag and drop the `ecommerce-catalog` folder
3. Wait for deployment to complete

## ⚙️ Configuration

### Environment Variables (Optional)

For production, you can configure these in Vercel:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API URL | Uses local JSON |
| `ANALYTICS_ID` | Google Analytics ID | None |

### Custom Domain

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## 🛠️ Customization

### Adding Products

Edit `data/products.json` to add new products:

```json
{
  "id": 13,
  "name": "Your Product Name",
  "slug": "your-product-name",
  "price": 99.99,
  "category": "electronics",
  "brand": "YourBrand",
  "description": "Product description...",
  "features": ["Feature 1", "Feature 2"],
  "images": ["image-url.jpg"],
  "thumbnail": "thumbnail-url.jpg"
}
```

### Changing Theme Colors

Edit `css/theme.css` to customize colors:

```css
:root {
  --color-primary: #2563eb;      /* Main brand color */
  --color-secondary: #0f172a;    /* Dark color */
  --color-accent: #f59e0b;       /* Accent color */
}
```

### Adding New Pages

1. Create new HTML file (e.g., `newpage.html`)
2. Add route in `js/router.js`:
   ```javascript
   '/newpage': { page: 'newpage', title: 'New Page' }
   ```
3. Add rewrite in `vercel.json`:
   ```json
   { "source": "/newpage", "destination": "/newpage.html" }
   ```

## 📊 Performance Optimization

This project includes several performance optimizations:

- **Lazy Loading** - Images load as they enter viewport
- **Caching** - API responses are cached for 5 minutes
- **Minification** - Production builds can use minified assets
- **Preconnect** - DNS prefetching for external resources
- **Responsive Images** - Optimized images from Pexels

### Lighthouse Scores

| Metric | Score |
|--------|-------|
| Performance | 90+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 90+ |

## 🧪 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

- Website: [techstore.com](https://techstore.vercel.app)
- Email: support@techstore.com

---

Made with ❤️ by TechStore Team
