# App Blocks Integration Guide

This Shopify theme now supports `@app` block types, allowing you to integrate third-party app blocks into various sections of your theme.

## What are App Blocks?

App blocks are dynamic content blocks that can be added to your theme sections through the Shopify theme editor. They allow apps to inject their content directly into your theme without requiring code modifications.

## Sections with App Block Support

### 1. Product Section (`sections/product.liquid`)
- **Location**: Product information area, after existing product blocks
- **Use Case**: Perfect for product reviews, social proof, related products, or any app that needs to display content on product pages

### 2. Header Section (`sections/header.liquid`)
- **Location**: Navigation area, after cart/account icons
- **Use Case**: Ideal for language selectors, currency converters, loyalty programs, or notification badges

### 3. Footer Section (`sections/footer.liquid`)
- **Location**: Footer content area, alongside other footer blocks
- **Use Case**: Great for social media feeds, newsletter signups, trust badges, or additional links

### 4. Custom App Section (`sections/custom-app-section.liquid`)
- **Location**: Can be added to any page template
- **Use Case**: Dedicated section for app integrations with custom styling and layout options

## How to Add App Blocks

### Method 1: Through Theme Editor
1. Go to your Shopify admin → Online Store → Themes
2. Click "Customize" on your active theme
3. Navigate to the page/section where you want to add app blocks
4. Click "Add block" in the section settings
5. Look for "App Block" in the block type dropdown
6. Select the app you want to integrate
7. Configure the app's settings as needed

### Method 2: Through App Installation
1. Install an app that supports app blocks
2. The app will automatically provide app block options in your theme editor
3. Follow the app's instructions to add their blocks to your theme

## Styling and Customization

### Header App Blocks
- Positioned after navigation icons
- Responsive design with mobile optimization
- Automatic spacing between multiple app blocks

### Footer App Blocks
- Styled with subtle background and border
- Responsive padding and margins
- Integrates seamlessly with existing footer design

### Product App Blocks
- Positioned in the product information area
- Maintains consistent spacing with other product blocks
- Responsive design for mobile devices

### Custom App Section
- Fully customizable background and text colors
- Configurable padding and spacing
- Responsive design with mobile breakpoints
- Can include custom content blocks alongside app blocks

## CSS Classes for Customization

If you need to customize the styling further, you can target these CSS classes:

```css
/* Header app blocks */
.header-app-block

/* Footer app blocks */
.footer-app-block

/* Product app blocks */
.product-app-block

/* Custom app section */
.custom-app-section
.app-blocks-container
.app-block
```

## Best Practices

1. **Limit Usage**: Don't add too many app blocks to avoid cluttering your design
2. **Test Responsiveness**: Always test app blocks on mobile devices
3. **Performance**: Monitor page load times when adding multiple app blocks
4. **User Experience**: Ensure app blocks enhance rather than detract from the user experience
5. **Consistency**: Maintain visual consistency with your theme's design

## Troubleshooting

### App Block Not Appearing
- Ensure the app is properly installed and activated
- Check if the app supports app blocks
- Verify the app block is added to the correct section

### Styling Issues
- Check for CSS conflicts with existing theme styles
- Use browser developer tools to inspect and debug styling
- Consider adding custom CSS to override conflicting styles

### Performance Issues
- Monitor page load times after adding app blocks
- Consider lazy loading for non-critical app blocks
- Contact the app developer if performance issues persist

## Example Use Cases

### Product Page
- Product reviews and ratings
- Social proof widgets
- Related products
- Size guides
- Stock notifications

### Header
- Language/currency selectors
- Loyalty program indicators
- Notification badges
- Search enhancements

### Footer
- Social media feeds
- Newsletter signups
- Trust badges
- Additional navigation

### Custom Section
- Dedicated app integration areas
- Marketing campaign widgets
- Customer support tools
- Analytics and tracking

## Support

For issues related to app blocks:
1. Check the app's documentation
2. Contact the app developer
3. Review Shopify's app block documentation
4. Test with a different app to isolate issues

## Technical Notes

- App blocks use the `{% render block %}` Liquid tag to render content
- Each app block includes `{{ block.shopify_attributes }}` for proper block management
- App blocks use the `@app` block type without additional attributes
- All app blocks are responsive and mobile-friendly 