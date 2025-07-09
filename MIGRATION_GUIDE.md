# Migration Guide: Static Sections to Section Groups

This guide will help you migrate from the old static section implementation to the new section groups system.

## What Changed

### Before (Static Sections)
Your theme.liquid file had individual section calls:
```liquid
{% section 'top-bar' %}
{% section 'header' %}
<!-- main content -->
{% section 'pickup-available' %}
{% section 'footer' %}
{% section 'newsletter-popup' %}
{% section 'cookie-banner' %}
```

### After (Section Groups)
Now you have organized section groups:
```liquid
{% section 'header-group' %}
<!-- main content -->
{% section 'footer-group' %}
<!-- Global elements are handled in theme layout -->
{% section 'newsletter-popup' %}
{% section 'cookie-banner' %}
{% section 'pickup-available' %}
```

## Migration Steps

### Step 1: Backup Your Theme
Before making any changes, create a backup of your current theme:
1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click "Actions" on your current theme
4. Select "Duplicate"
5. Rename the duplicate to "Backup - [Date]"

### Step 2: Update Theme Files
The theme.liquid file has already been updated to use the new section groups. The changes include:

- Replaced individual section calls with section group calls
- Removed redundant section calls that are now handled by groups
- Maintained all existing functionality

### Step 3: Configure Section Groups
After the update, you'll need to configure the section groups in your theme editor:

#### Header Group Configuration
1. Go to your theme editor
2. Find the "Header Group" section
3. Configure the blocks:
   - **Top Bar**: Enable/disable the top bar with social media and announcements
   - **Main Header**: Configure your main navigation (settings remain in the Header section)
   - **Mobile Menu**: Configure mobile navigation (settings remain in the Mobile Menu section)
   - **Announcement Bar**: Enable/disable promotional announcements

#### Footer Group Configuration
1. Find the "Footer Group" section
2. Configure the blocks:
   - **Main Footer**: Configure your footer content (settings remain in the Footer section)

#### Global Elements Configuration
The following elements are global and can be configured in their respective sections:
- **Newsletter Popup**: Configure in the Newsletter Popup section
- **Cookie Banner**: Configure in the Cookie Banner section  
- **Pickup Available**: Configure in the Pickup Available section

### Step 4: Test Your Theme
After configuration, test your theme thoroughly:

1. **Desktop Testing**:
   - Check header navigation
   - Verify top bar functionality
   - Test footer links and newsletter signup
   - Ensure cookie banner appears correctly

2. **Mobile Testing**:
   - Test mobile menu functionality
   - Verify responsive behavior
   - Check touch interactions

3. **Functionality Testing**:
   - Test search functionality
   - Verify cart drawer
   - Check account/login features
   - Test newsletter popup (if enabled)

## What's Different

### Section Organization
- **Before**: Sections were scattered throughout the theme
- **After**: Related sections are grouped together logically

### Configuration
- **Before**: Each section had its own settings panel
- **After**: Section groups have their own settings, plus individual section settings

### Flexibility
- **Before**: All sections were always loaded
- **After**: You can enable/disable sections as needed

## Benefits You'll See

### 1. Better Organization
- Header-related sections are grouped together
- Footer-related sections are grouped together
- Clearer structure in the theme editor

### 2. Improved Performance
- Disable unused sections to improve page load times
- Conditional loading based on settings
- Reduced DOM complexity

### 3. Easier Management
- Control section visibility from one place
- Prevent accidental addition of inappropriate sections
- Better organization of related functionality

## Troubleshooting Migration Issues

### Issue: Sections Not Displaying
**Solution**: Check if the section is enabled in the section group settings

### Issue: Settings Not Saving
**Solution**: 
1. Clear your browser cache
2. Refresh the theme editor
3. Try saving settings again

### Issue: Layout Broken
**Solution**:
1. Check if all required sections are enabled
2. Verify section order in the group
3. Test with default configuration first

### Issue: Mobile Menu Not Working
**Solution**:
1. Ensure Mobile Menu block is added to Header Group
2. Check Mobile Menu section settings
3. Verify JavaScript is loading correctly

## Rollback Plan

If you need to rollback to the old system:

1. **Restore from Backup**:
   - Go to Online Store > Themes
   - Find your backup theme
   - Click "Actions" > "Publish"

2. **Manual Rollback**:
   - Replace section group calls with individual section calls
   - Restore original theme.liquid structure

## Post-Migration Checklist

After completing the migration, verify these items:

- [ ] Header navigation works correctly
- [ ] Mobile menu functions properly
- [ ] Footer links are working
- [ ] Newsletter signup works (if enabled)
- [ ] Cookie banner appears (if enabled)
- [ ] Search functionality works
- [ ] Cart drawer opens correctly
- [ ] Account/login features work
- [ ] Social media links are functional
- [ ] Language/currency selectors work
- [ ] Responsive design is maintained
- [ ] Page load times are acceptable

## Support

If you encounter issues during migration:

1. **Check Documentation**: Review the SECTION_GROUPS_README.md file
2. **Test Incrementally**: Make changes one at a time and test
3. **Use Backup**: Always have a backup theme ready
4. **Contact Support**: Reach out to the theme development team

## Next Steps

After successful migration:

1. **Optimize Performance**: Disable unused sections
2. **Customize Layout**: Adjust section order and settings
3. **Test Different Pages**: Ensure consistency across all page types
4. **Monitor Analytics**: Track performance improvements
5. **Plan Future Updates**: Consider adding new sections to groups

## Common Questions

### Q: Can I still customize individual sections?
**A**: Yes! Individual section settings remain unchanged. Section groups just control which sections are displayed.

### Q: Will this affect my existing customizations?
**A**: No, your existing section settings and customizations will be preserved.

### Q: Can I add new sections to the groups?
**A**: Yes, you can add new block types to the section groups following the documentation.

### Q: Is this change required?
**A**: While not strictly required, it's recommended for better organization and performance.

### Q: Will this affect my SEO?
**A**: No, the SEO structure remains the same. Only the organization has changed.

## Conclusion

The migration to section groups provides better organization, improved performance, and easier management of your theme. Follow this guide step-by-step, and you'll have a more maintainable and flexible theme structure. 