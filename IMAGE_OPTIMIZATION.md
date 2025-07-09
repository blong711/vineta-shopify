# Image Optimization System

This document outlines the comprehensive image optimization system implemented in the Shopify theme to address performance and user experience issues.

## Overview

The new image optimization system provides:
- **Responsive images** with proper sizing for different screen sizes
- **WebP format support** with fallback to JPEG/PNG
- **Lazy loading** for better performance
- **Variant image switching** for color swatches
- **Progressive loading** with loading states
- **Error handling** for failed image loads

## Components

### 1. Responsive Image Snippet (`responsive-image.liquid`)

The core snippet that generates responsive images with WebP support.

**Usage:**
```liquid
{% render 'responsive-image', 
  image: product.featured_image, 
  alt: product.title, 
  class: 'product-image' %}
```

**Parameters:**
- `image`: The image object
- `alt`: Alt text for the image
- `class`: CSS class(es) for the image
- `sizes`: Custom sizes attribute (optional)
- `lazy`: Whether to use lazy loading (default: true)
- `preload`: Whether to preload this image (default: false)
- `aspect_ratio`: Custom aspect ratio (optional)
- `max_width`: Maximum width for the image (optional)

### 2. Product Image Snippet (`product-image.liquid`)

Specialized snippet for product images with variant support and hover effects.

**Usage:**
```liquid
{% render 'product-image', 
  product: product, 
  variant: variant, 
  class: 'product-image' %}
```

**Parameters:**
- `product`: The product object
- `variant`: The variant object (optional)
- `class`: CSS class(es) for the image
- `sizes`: Custom sizes attribute (optional)
- `lazy`: Whether to use lazy loading (default: true)
- `preload`: Whether to preload this image (default: false)
- `show_hover`: Whether to show hover image (default: true)
- `aspect_ratio`: Custom aspect ratio (optional)

### 3. Product Gallery Image Snippet (`product-gallery-image.liquid`)

Specialized snippet for product gallery images with zoom functionality.

**Usage:**
```liquid
{% render 'product-gallery-image', 
  media: media, 
  product: product %}
```

**Parameters:**
- `media`: The media object (image, video, model)
- `product`: The product object
- `class`: CSS class(es) for the image
- `sizes`: Custom sizes attribute (optional)
- `lazy`: Whether to use lazy loading (default: true)
- `zoom`: Whether to enable zoom functionality (default: true)

## Features

### Responsive Images

The system generates multiple image sizes and uses the `srcset` and `sizes` attributes to serve the appropriate image based on the device and viewport size.

**Default breakpoints:**
- Mobile (≤480px): 100vw
- Tablet (≤768px): 50vw
- Desktop (≤1024px): 33vw
- Large Desktop (>1024px): 25vw

### WebP Support

The system automatically serves WebP images to supported browsers with fallback to JPEG/PNG for older browsers.

**Benefits:**
- 25-35% smaller file sizes
- Better compression
- Faster loading times

### Lazy Loading

Images are loaded only when they enter the viewport, improving initial page load performance.

**Features:**
- Intersection Observer API for modern browsers
- Fallback scroll-based loading for older browsers
- Configurable loading threshold (50px by default)

### Variant Image Switching

Color swatches automatically switch product images when clicked, providing immediate visual feedback.

**Implementation:**
- Variant images are preloaded as overlays
- Smooth transitions between images
- Maintains hover functionality

### Error Handling

The system gracefully handles failed image loads with fallback images and user-friendly error states.

## CSS Classes

### Base Classes
- `.responsive-image-wrapper`: Container for responsive images
- `.product-image-container`: Container for product images
- `.gallery-image-wrapper`: Container for gallery images

### State Classes
- `.lazyload`: Image is waiting to be loaded
- `.lazyloaded`: Image has been loaded
- `.loading`: Image is currently loading
- `.error`: Image failed to load

### Utility Classes
- `.aspect-ratio-1-1`: 1:1 aspect ratio
- `.aspect-ratio-4-3`: 4:3 aspect ratio
- `.aspect-ratio-16-9`: 16:9 aspect ratio
- `.aspect-ratio-3-4`: 3:4 aspect ratio

## JavaScript API

### ResponsiveImages Class

The main class that handles all image optimization functionality.

**Methods:**
- `init()`: Initialize the system
- `setupLazyLoading()`: Setup lazy loading
- `setupVariantImageSwitching()`: Setup variant switching
- `setupWebPSupport()`: Setup WebP support detection
- `loadImage(img)`: Load a specific image
- `switchVariantImage(colorSwatch)`: Switch variant image

### Events

- `shopify:section:load`: Reinitialize for dynamic content
- `variant:change`: Handle variant changes
- `error`: Handle image load errors

## Performance Optimizations

### 1. Connection-Aware Loading

The system detects connection speed and adjusts image quality accordingly:
- Slow connections (2G): Reduced image quality
- Fast connections: Full quality images

### 2. Critical Image Preloading

Important images (above the fold) can be preloaded for faster display.

### 3. Progressive Loading

Images load progressively with loading states and smooth transitions.

### 4. Memory Management

Images are properly unloaded when no longer needed to prevent memory leaks.

## Browser Support

- **Modern browsers**: Full support with Intersection Observer
- **Older browsers**: Fallback to scroll-based lazy loading
- **WebP support**: Automatic detection and fallback
- **Mobile browsers**: Optimized for touch interactions

## Migration Guide

### From Old Image System

1. Replace direct image tags with snippet calls:
   ```liquid
   <!-- Old -->
   <img src="{{ image | image_url: width: 400 }}" alt="{{ alt }}">
   
   <!-- New -->
   {% render 'responsive-image', image: image, alt: alt %}
   ```

2. Update product cards:
   ```liquid
   <!-- Old -->
   {{ product.featured_image | image_url: width: 400 | image_tag }}
   
   <!-- New -->
   {% render 'product-image', product: product %}
   ```

3. Update gallery images:
   ```liquid
   <!-- Old -->
   <img src="{{ media | image_url: width: 400 }}">
   
   <!-- New -->
   {% render 'product-gallery-image', media: media, product: product %}
   ```

### Customization

1. **Custom sizes**: Override default sizes for specific use cases
2. **Custom aspect ratios**: Set specific aspect ratios for different layouts
3. **Custom loading behavior**: Configure lazy loading and preloading
4. **Custom error handling**: Override default error states

## Best Practices

1. **Always provide alt text** for accessibility
2. **Use appropriate aspect ratios** for your layout
3. **Preload critical images** above the fold
4. **Test on different devices** and connection speeds
5. **Monitor performance** using browser dev tools
6. **Optimize image sources** before uploading to Shopify

## Troubleshooting

### Common Issues

1. **Images not loading**: Check network tab for failed requests
2. **WebP not working**: Verify browser support
3. **Lazy loading not working**: Check Intersection Observer support
4. **Variant switching not working**: Verify variant image data

### Debug Mode

Enable debug mode by adding `?debug=images` to the URL to see detailed loading information in the console.

## Performance Metrics

Expected improvements:
- **Initial page load**: 30-50% faster
- **Image loading**: 40-60% faster with WebP
- **Memory usage**: 20-30% reduction
- **User experience**: Smoother interactions and transitions 