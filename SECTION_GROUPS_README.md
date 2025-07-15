# Section Groups Implementation

This document explains the new section groups implementation for the Vineta Shopify theme, which replaces static header and footer sections with flexible section groups.

## Overview

Section groups allow you to organize related sections together and control which sections are displayed. This implementation provides better organization and prevents irrelevant sections from being added to header and footer areas.

## Header Group (`sections/header-group.liquid`)

The header group contains all header-related sections and allows you to control their visibility.

### Available Blocks

1. **Top Bar** (`top_bar`)
   - **Limit**: 1
   - **Purpose**: Shows social media links, announcements, and language/currency selectors
   - **Settings**: Enable/disable the top bar
   - **Default**: Enabled

2. **Main Header** (`header`)
   - **Limit**: 1
   - **Purpose**: Main navigation header with logo, menu, and cart/account icons
   - **Settings**: Configuration is managed in the Header section itself
   - **Required**: Yes (always included)

3. **Mobile Menu** (`mobile_menu`)
   - **Limit**: 1
   - **Purpose**: Mobile navigation menu with search and account options
   - **Settings**: Configuration is managed in the Mobile Menu section itself
   - **Required**: Yes (always included)

4. **Announcement Bar** (`announcement_bar`)
   - **Limit**: 1
   - **Purpose**: Promotional announcements across the site
   - **Settings**: Enable/disable the announcement bar
   - **Default**: Disabled

### Default Configuration

The header group comes with these blocks by default:
- Top Bar (enabled)
- Main Header
- Mobile Menu

## Footer Group (`sections/footer-group.liquid`)

The footer group contains the main footer section. Global elements like newsletter popup, cookie banner, and pickup available are handled separately in the theme layout.

### Available Blocks

1. **Main Footer** (`footer`)
   - **Limit**: 1
   - **Purpose**: Main footer with contact info, newsletter signup, and menu links
   - **Settings**: Configuration is managed in the Footer section itself
   - **Required**: Yes (always included)

### Default Configuration

The footer group comes with this block by default:
- Main Footer

### Global Elements

The following elements are global and appear across the entire site (not just in the footer):
- **Newsletter Popup**: Newsletter signup popup for visitors
- **Cookie Banner**: Cookie consent banner for privacy compliance  
- **Pickup Available**: Shows pickup availability information

These are managed directly in the theme layout and can be enabled/disabled in their respective section settings.

## Benefits of Section Groups

### 1. **Controlled Section Addition**
- Only relevant sections can be added to header and footer areas
- Prevents accidental addition of inappropriate sections
- Clear organization of related functionality

### 2. **Flexible Configuration**
- Enable/disable sections as needed
- Maintain individual section settings while controlling visibility
- Easy to customize for different page types

### 3. **Better Organization**
- Related sections are grouped together
- Clearer structure in the theme editor
- Easier to manage and maintain

### 4. **Performance Optimization**
- Unused sections can be disabled to improve performance
- Conditional loading based on settings
- Reduced DOM complexity when sections are disabled

## Migration from Static Sections

### Before (Static Sections)
```liquid
{% section 'top-bar' %}
{% section 'header' %}
<!-- main content -->
{% section 'footer' %}
{% section 'newsletter-popup' %}
{% section 'cookie-banner' %}
```

### After (Section Groups)
```liquid
{% section 'header-group' %}
<!-- main content -->
{% section 'footer-group' %}
<!-- Global elements are handled in theme layout -->
{% section 'newsletter-popup' %}
{% section 'cookie-banner' %}
{% section 'pickup-available' %}
```

## How to Use in Theme Editor

### Adding Header Group
1. Go to the theme editor
2. Navigate to the page where you want to add the header
3. Click "Add section"
4. Select "Header Group"
5. Configure the blocks as needed

### Adding Footer Group
1. Go to the theme editor
2. Navigate to the page where you want to add the footer
3. Click "Add section"
4. Select "Footer Group"
5. Configure the blocks as needed

### Managing Blocks
1. Click on the section group in the theme editor
2. Use the "Add block" button to add new blocks
3. Click on individual blocks to configure their settings
4. Use the drag handle to reorder blocks
5. Use the delete button to remove blocks

## Validation and Restrictions

### Header Group Restrictions
- Maximum 4 blocks allowed
- Top bar and announcement bar are limited to 1 instance each
- Main header and mobile menu are required and limited to 1 instance each
- Only header-related sections can be added

### Footer Group Restrictions
- Maximum 1 block allowed
- Main footer is required and limited to 1 instance
- Only footer-related sections can be added

## Customization

### Adding New Block Types
To add new block types to the section groups:

1. **For Header Group**:
   - Add a new case in the `{%- case block.type -%}` statement
   - Add the corresponding block definition in the schema
   - Ensure the section file exists

2. **For Footer Group**:
   - Add a new case in the `{%- case block.type -%}` statement
   - Add the corresponding block definition in the schema
   - Ensure the section file exists

### Example: Adding a Custom Header Block
```liquid
{%- when 'custom_header_block' -%}
  {%- if block.settings.enable_custom_block -%}
    {% section 'custom-header-section' %}
  {%- endif -%}
```

And in the schema:
```json
{
  "type": "custom_header_block",
  "name": "Custom Header Block",
  "limit": 1,
  "settings": [
    {
      "type": "checkbox",
      "id": "enable_custom_block",
      "label": "Enable Custom Block",
      "default": false
    }
  ]
}
```

## Best Practices

1. **Keep Related Sections Together**: Use section groups to organize related functionality
2. **Use Conditional Rendering**: Enable/disable sections based on page requirements
3. **Maintain Performance**: Disable unused sections to improve page load times
4. **Follow Naming Conventions**: Use clear, descriptive names for blocks and settings
5. **Document Changes**: Update this documentation when adding new block types

## Troubleshooting

### Common Issues

1. **Section Not Displaying**
   - Check if the section is enabled in the block settings
   - Verify the section file exists in the sections directory
   - Check for any Liquid syntax errors

2. **Block Not Available**
   - Ensure the block type is defined in the schema
   - Check if the block limit has been reached
   - Verify the block is appropriate for the section group

3. **Settings Not Saving**
   - Check for JSON syntax errors in the schema
   - Verify all required fields are properly defined
   - Ensure setting IDs are unique within the block

### Debug Mode
To debug section group issues:
1. Enable theme editor debug mode
2. Check the browser console for JavaScript errors
3. Verify Liquid syntax in the section files
4. Test with minimal configuration first

## Future Enhancements

Potential improvements for the section groups:

1. **Template-Specific Groups**: Different configurations for different page templates
2. **Conditional Logic**: More sophisticated conditional rendering based on page context
3. **Performance Monitoring**: Built-in performance metrics for section loading
4. **A/B Testing**: Support for testing different section configurations
5. **Analytics Integration**: Track section usage and performance

## Support

For questions or issues with section groups:
1. Check this documentation first
2. Review the Shopify section groups documentation
3. Test with a minimal configuration
4. Contact the theme development team 