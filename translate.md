✅ Objectives
Identify all static English text in HTML or Liquid output (e.g., in <h1>, <p>, alt="", aria-label=, button, etc.).

📂 Input: Shopify Theme Files to Review
This is all files I need to review
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/blog-sub-collection.liquid`  
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/brands.liquid`  
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/breadcrumb.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/cart-drawer.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/cart.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/categories.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/collection-header.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/collection-list.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/collection.liquid`
`/home/ryotaru/dev/shopify-theme5/shopify-theme/sections/coming-soon.liquid`

Replace static text with translation keys using the t filter:
{{ 'your_translation_key' | t }}
Add each translation key and value to the locales/en.default.json file.

🛠️ Rules
✅ Do not modify dynamic Liquid variables (e.g., {{ product.title }}).

✅ Keep the layout, tags, and structure the same.

✅ Generate semantic translation keys using lowercase with underscores:

✅ Keep the text the same as static when add to translation, don't modify it.

Example: homepage_hero_title, product_card_add_to_cart, footer_contact_info.

✅ Reuse translation keys if the text is the same.

❌ Do not change HTML, CSS classes, or Liquid logic.

✅ Maintain full compatibility with Shopify theme best practices.

✏️ Example
Before:
<h2>Welcome to our store</h2>
<button>Shop Now</button>
After:

<h2>{{ 'homepage_welcome_message' | t }}</h2>
<button>{{ 'homepage_shop_now_button' | t }}</button>
In locales/en.default.json:
{
  "homepage_welcome_message": "Welcome to our store",
  "homepage_shop_now_button": "Shop Now"
}


After the transformation, verify:

The theme still works visually the same.

All user-facing static text is handled via translation.

All keys are added to en.default.json.