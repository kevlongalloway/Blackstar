#!/usr/bin/env node

/**
 * Shopify Product Web Scraper
 * Scrapes products from Shopify storefront HTML
 *
 * Usage: node scraper.js
 * Or: npm run scrape
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = 'blackstarthebrand.myshopify.com';
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

function fetchHTML(urlPath = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: urlPath,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 404) {
        return reject(new Error(`Page not found: ${urlPath}`));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    req.end();
  });
}

function extractProducts(html) {
  const products = [];

  // Match Shopify product data in the HTML
  // Look for JSON-LD structured data or product listings

  // Try to find Shopify's product JSON data in the page
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd['@type'] === 'Product' || jsonLd.itemListElement) {
        const items = jsonLd.itemListElement || [jsonLd];
        items.forEach(item => {
          if (item.url || item.name) {
            products.push({
              title: item.name || 'Unknown',
              price: item.offers?.price || '0',
              image: item.image?.url || item.image || '',
              url: item.url || '#',
              id: Math.random().toString(36).substr(2, 9)
            });
          }
        });
      }
    } catch (e) {
      // Continue if JSON-LD parsing fails
    }
  }

  // Fallback: Look for product grid items
  if (products.length === 0) {
    // Match common Shopify product HTML patterns
    const productRegex = /<a[^>]*href="\/products\/([^"]*)"[^>]*>/g;
    const titleRegex = /<h[2-3][^>]*>([^<]*)<\/h/;
    const priceRegex = /\$?([\d,]+\.?\d*)/;

    let match;
    while ((match = productRegex.exec(html)) !== null) {
      const url = `/products/${match[1]}`;
      const section = html.substring(Math.max(0, match.index - 500), match.index + 500);
      const titleMatch = section.match(titleRegex);
      const priceMatch = section.match(priceRegex);

      products.push({
        id: Math.random().toString(36).substr(2, 9),
        title: titleMatch ? titleMatch[1].trim() : 'Product',
        price: priceMatch ? priceMatch[1] : '0',
        image: '',
        url: url
      });
    }
  }

  return products;
}

async function main() {
  try {
    console.log(`Scraping products from https://${SHOPIFY_STORE}...`);
    const html = await fetchHTML('/products');

    if (!html) {
      throw new Error('No HTML content received');
    }

    const products = extractProducts(html);

    if (products.length === 0) {
      console.warn('⚠ No products found. Trying alternate pages...');

      // Try alternate endpoints
      try {
        const collectionHtml = await fetchHTML('/collections/all');
        const collectionProducts = extractProducts(collectionHtml);

        if (collectionProducts.length > 0) {
          products.push(...collectionProducts);
        }
      } catch (e) {
        console.warn('  - /collections/all not found');
      }
    }

    if (products.length === 0) {
      throw new Error('Could not extract any products from the store');
    }

    // Deduplicate by URL
    const uniqueProducts = Array.from(new Map(products.map(p => [p.url, p])).values());

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(uniqueProducts, null, 2));
    console.log(`✓ Successfully scraped ${uniqueProducts.length} products`);
    console.log(`✓ Saved to products.json`);
    console.log('\nSample products:');
    uniqueProducts.slice(0, 3).forEach(p => {
      console.log(`  - ${p.title} ($${p.price})`);
    });
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('- Check that you have internet access');
    console.error('- Verify the Shopify store URL is correct');
    console.error('- Try visiting the store manually to confirm it\'s accessible');
    console.error(`- The scraper tries: https://${SHOPIFY_STORE}/products`);
    process.exit(1);
  }
}

main();
