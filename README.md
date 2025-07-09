# Shopify Theme 5 - Online Store 2.0 Compliant

This Shopify theme has been updated to be fully compliant with Online Store 2.0 standards, including support for app blocks and section groups.

## Online Store 2.0 Features

### Section Groups
- **Header Group** (`sections/header-group.liquid`): Contains the header section and supports app blocks
- **Footer Group** (`sections/footer-group.liquid`): Contains the footer section and supports app blocks

### App Blocks Support
The theme now supports third-party app blocks that can be added to:
- Header section group
- Footer section group
- Any other section that supports app blocks

### Key Changes Made

1. **Section Groups Implementation**
   - Created `header-group.liquid` and `footer-group.liquid` section groups
   - Moved header and footer content to separate snippets (`snippets/header.liquid` and `snippets/footer.liquid`)
   - Updated `layout/theme.liquid` to use section groups instead of individual sections

2. **App Blocks Support**
   - Added `@app` block type to both header and footer groups
   - Configured proper schema definitions for app block compatibility
   - Enabled app blocks in theme settings

3. **Theme Configuration**
   - Updated `config/settings_schema.json` to include Online Store 2.0 settings
   - Added app blocks enable/disable option
   - Maintained backward compatibility with existing theme settings

## Usage

### Adding App Blocks
1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click "Customize" on your active theme
4. In the theme editor, you can now add app blocks to:
   - Header section group
   - Footer section group
   - Any other compatible sections

### App Block Compatibility
Apps that support Online Store 2.0 app blocks will automatically appear in the "Add block" menu when editing header or footer sections.

### Customization
- Header and footer settings are now managed through their respective section groups
- App blocks can be reordered within section groups
- Each app block can be individually configured

## File Structure

```
shopify-theme/
├── sections/
│   ├── header-group.liquid      # Header section group
│   ├── footer-group.liquid      # Footer section group
│   ├── header.liquid            # Original header section (kept for reference)
│   └── footer.liquid            # Original footer section (kept for reference)
├── snippets/
│   ├── header.liquid            # Header content snippet
│   └── footer.liquid            # Footer content snippet
├── layout/
│   └── theme.liquid             # Updated to use section groups
└── config/
    └── settings_schema.json     # Updated with OS 2.0 settings
```

## Benefits

1. **App Compatibility**: Third-party apps can now add blocks to header and footer
2. **Better Customization**: Merchants can easily add/remove/reorder app blocks
3. **Future-Proof**: Theme is now compatible with Shopify's latest features
4. **Maintained Functionality**: All existing theme features continue to work

## Migration Notes

- Existing header and footer sections are preserved for reference
- Theme settings remain unchanged
- No breaking changes to existing functionality
- App blocks are opt-in and can be disabled if needed

## Support

For questions about the Online Store 2.0 implementation or app blocks support, please refer to the Shopify documentation or contact theme support. 