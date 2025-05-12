# 🧩 Manual: How to Use Shopify Theme Blocks with `{% content_for 'blocks' %}`

## 📘 Overview

Shopify's **Theme Blocks** architecture allows developers to define reusable block components in the `/blocks` directory and render them inside a section using:

```liquid
{% content_for 'blocks' %}
```

This enables **modular, composable sections** and gives merchants greater control in the Theme Editor.

---

## 📁 1. Directory Structure

Make sure your theme contains the following:

```
/blocks
  └── text.liquid
/sections
  └── custom-section.liquid
/templates
  └── page.custom.json
```

---

## 🧱 2. Create a Theme Block

Create a file in `/blocks/` named `text.liquid`:

```liquid
<div class="text-block">
  {{ block.settings.text }}
</div>

{% schema %}
{
  "name": "Text Block",
  "settings": [
    {
      "type": "text",
      "id": "text",
      "label": "Text",
      "default": "Sample text"
    }
  ],
  "presets": [
    {
      "name": "Default"
    }
  ]
}
{% endschema %}
```

---

## 🧩 3. Create a Section That Uses Theme Blocks

In `/sections/custom-section.liquid`, write:

```liquid
<section class="custom-section">
  {% content_for 'blocks' %}
</section>

{% schema %}
{
  "name": "Custom Section",
  "blocks": [
    {
      "type": "@theme"
    }
  ],
  "presets": [
    {
      "name": "Default"
    }
  ]
}
{% endschema %}
```

### 🔸 Explanation:
- `"type": "@theme"` allows this section to accept **any theme block** defined in `/blocks/`.
- `{% content_for 'blocks' %}` renders the configured blocks dynamically.

---

## 📄 4. Add the Section in a JSON Template

Create or edit a template like `templates/page.custom.json`:

```json
{
  "sections": {
    "main": {
      "type": "custom-section",
      "blocks": {
        "block1": {
          "type": "text",
          "settings": {
            "text": "Hello, World!"
          }
        }
      },
      "block_order": ["block1"]
    }
  },
  "order": ["main"]
}
```

---

## 🛠 5. Using the Theme Editor

1. Go to **Online Store → Themes → Customize**.
2. Open a page that uses `page.custom` template.
3. Select **Custom Section**.
4. Add, remove, and reorder **theme blocks** (e.g., Text Block).
5. Configure each block individually.

---

## 🧪 6. Tips & Best Practices

- Keep block names lowercase and kebab-case (`text-block.liquid`).
- Use reusable blocks across sections.
- Prefer blocks over hardcoding for editable UI parts.
- Use `{% content_for 'blocks' %}` only in sections that define `"type": "@theme"`.

---

## ✅ Summary

| Feature           | Benefit                                |
|-------------------|-----------------------------------------|
| Modular design    | Clean, reusable block templates         |
| Merchant-friendly | Blocks editable in the Theme Editor     |
| Composable UI     | Sections accept any theme block         |
| DRY principle     | No repeated markup across sections      |

---

## 📚 Resources

- [Shopify Theme Blocks Quick Start](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/quick-start?framework=liquid)
- [Shopify Theme Architecture Overview](https://shopify.dev/docs/storefronts/themes/architecture)
