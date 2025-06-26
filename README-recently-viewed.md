# Recently Viewed Products Feature

This feature tracks products that visitors view and displays them in a "Recently Viewed" section on product pages and search pages.

## How It Works

1. **Product Tracking**: Every time a visitor visits a product page, the product information is automatically saved to localStorage
2. **Display**: The recently viewed products are displayed in a carousel/slider format
3. **Exclusion**: The current product is automatically excluded from the recently viewed list
4. **Persistence**: Products are stored in the browser's localStorage and persist across sessions
5. **Integration**: Recently viewed products now fully integrate with product-card.js functionality

## Integration with Product Card Functionality

The recently viewed products now properly integrate with the theme's product card functionality:

### Features Available
- **Add to Cart**: Products can be added to cart directly from the recently viewed section
- **Wishlist**: Products can be added to/removed from wishlist
- **Compare**: Products can be added to/removed from compare list
- **Quick View**: Quick view modal functionality works for recently viewed products
- **Variant Selection**: Color swatches and variant selection work properly
- **Image Switching**: Hover effects and variant image switching work correctly

### Technical Implementation
- Full product data is fetched from Shopify's API for each recently viewed product
- Product card HTML structure matches the card-product snippet
- ProductCard.initializeForDynamicProducts() is called after rendering to enable all functionality
- Error handling ensures graceful degradation if product-card.js is not available

## Files Modified/Created

### New Files
- `snippets/recently-viewed-tracking.liquid` - Core tracking functionality
- `README-recently-viewed.md` - This documentation file

### Modified Files
- `sections/recently-viewed.liquid` - Updated to use actual recently viewed products and integrate with product-card.js
- `sections/product.liquid` - Added product data script and tracking
- `sections/search-page.liquid` - Added recently viewed section with product-card.js integration
- `layout/theme.liquid` - Added global tracking script
- `assets/product-card.js` - Added helper function for dynamic product initialization

## Features

### Automatic Tracking
- Products are automatically tracked when visitors view product pages
- Product data includes: ID, title, handle, URL, price, compare price, featured image, availability, and vendor
- Maximum of 20 products stored (configurable)

### Smart Display
- Recently viewed products are displayed in a responsive carousel
- Current product is automatically excluded from the list
- Section is hidden if no recently viewed products exist
- Responsive design with different slides per view for mobile, tablet, and desktop

### Cross-Page Functionality
- Works on product pages (excludes current product)
- Works on search pages (shows all recently viewed products)
- Global tracking available on all pages

## Configuration

### Section Settings
The recently viewed section can be configured through the theme customizer:

- **Title**: Section title (default: "Recently Viewed")
- **Width**: Full width or boxed layout
- **Products to show**: Number of products to display (4-12)
- **Slides per view**: Responsive settings for mobile, tablet, and desktop
- **Space between**: Gap between slides

### JavaScript Configuration
In `snippets/recently-viewed-tracking.liquid`:

```javascript
const STORAGE_KEY = 'shopify_recently_viewed_products';
const MAX_PRODUCTS = 20; // Maximum number of products to store
```

## Usage

### For Developers

#### Access Recently Viewed Products
```javascript
// Get all recently viewed products
const products = window.RecentlyViewedManager.getProducts();

// Get products excluding current product
const products = window.RecentlyViewedManager.getProductsExcludingCurrent(currentProductId, limit);

// Add a product manually
window.RecentlyViewedManager.addProduct(productData);

// Clear all products
window.RecentlyViewedManager.clearProducts();
```

#### Debug Utilities
```javascript
// Show current products in console
window.RecentlyViewedDebug.show();

// Clear all products
window.RecentlyViewedDebug.clear();

// Add a test product
window.RecentlyViewedDebug.addTest();
```

#### Listen for Updates
```javascript
window.addEventListener('recentlyViewedUpdated', function(event) {
  const products = event.detail.products;
  // Handle updated products
});
```

### For Merchants

1. **Enable the Section**: Add the "Recently Viewed" section to your product page template
2. **Configure Settings**: Adjust the section settings in the theme customizer
3. **Test the Feature**: Visit different product pages to see the tracking in action

## Browser Compatibility

- Uses localStorage for data persistence
- Works in all modern browsers
- Gracefully degrades if localStorage is not available
- No impact on page performance

## Customization

### Styling
The recently viewed products use the same styling as regular product cards. You can customize the appearance by modifying the CSS classes used in the sections.

### Product Data
The tracking stores the following product information:
- Product ID
- Title
- Handle
- URL
- Price (in cents)
- Compare at price (in cents)
- Featured image URL
- Availability status
- Vendor

### Adding More Data
To track additional product information, modify the `addProduct` function in the tracking script and update the display templates accordingly.

## Troubleshooting

### Products Not Showing
1. Check browser console for errors
2. Verify localStorage is available
3. Use `window.RecentlyViewedDebug.show()` to check stored products
4. Ensure the tracking script is loaded

### Performance Issues
1. The feature uses minimal resources
2. Products are stored locally in the browser
3. No server requests are made for tracking
4. Display is handled client-side

### Testing
1. Visit multiple product pages
2. Check the recently viewed section appears
3. Verify current product is excluded
4. Test on different devices/browsers

## Future Enhancements

Potential improvements:
- Server-side tracking for analytics
- Product recommendations based on recently viewed
- Integration with wishlist functionality
- Export/import recently viewed data
- Category-based filtering
- Time-based expiration of old entries 