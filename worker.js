#!/usr/bin/env node

/**
 * Background Worker for Shopify Scraper
 * Runs on Render as a background service
 * Scrapes products at a set interval and updates products.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SHOPIFY_STORE = 'blackstarthebrand.myshopify.com';
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Scrape every 6 hours
const SCRAPE_INTERVAL = 6 * 60 * 60 * 1000;

function fetchProducts(limit = 250) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/products.json?limit=${limit}`,
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.products || []);
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
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

function formatProducts(products) {
  return products.map(product => {
    const variant = product.variants?.[0];
    const image = product.images?.[0];

    return {
      id: product.id,
      title: product.title,
      price: variant?.price || '0',
      currency: variant?.currency_code || 'USD',
      image: image?.src || '',
      alt: image?.alt || product.title,
      url: `/products/${product.handle}`,
      handle: product.handle,
      description: product.body_html || ''
    };
  });
}

async function scrape() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting product scrape...`);

  try {
    const products = await fetchProducts();

    if (products.length === 0) {
      console.log(`[${timestamp}] ⚠ No products found`);
      return;
    }

    const formatted = formatProducts(products);
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(formatted, null, 2));

    console.log(`[${timestamp}] ✓ Scraped ${formatted.length} products`);
  } catch (error) {
    console.error(`[${timestamp}] ✗ Scrape failed: ${error.message}`);
  }
}

async function start() {
  console.log('BLACKSTAR Product Scraper Worker Started');
  console.log(`Scraping every ${SCRAPE_INTERVAL / 1000 / 60 / 60} hours`);

  // Run immediately on start
  await scrape();

  // Then run periodically
  setInterval(scrape, SCRAPE_INTERVAL);

  // Keep the process alive
  process.on('SIGTERM', () => {
    console.log('Worker shutting down gracefully...');
    process.exit(0);
  });
}

start();
