'use strict';

// ─── API ─────────────────────────────────────────────────────────────────────
// Set via window.BST_API_BASE (injected by config.js, generated at build time).
// On Render, configure the API_BASE_URL environment variable in the dashboard.
const API_BASE = 'https://ecommaxxing.kevlongalloway1999m.workers.dev'

// ─── CART STORAGE ─────────────────────────────────────────────────────────────
const CART_KEY = 'bst_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function _saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('bst:cart-updated'));
}

function addToCart(product, quantity, size) {
  const qty  = Math.max(1, parseInt(quantity, 10) || 1);
  const cart = getCart();
  const lId  = size ? product.id + ':' + size : product.id;
  const idx  = cart.findIndex(i => (i.lineId || i.productId) === lId);
  if (idx >= 0) {
    cart[idx].quantity += qty;
  } else {
    cart.push({
      lineId:    lId,
      productId: product.id,
      name:      product.name,
      price:     product.price,
      currency:  product.currency,
      image:     (product.images && product.images[0]) ? product.images[0] : '',
      quantity:  qty,
      size:      size || null,
    });
  }
  _saveCart(cart);
}

function removeFromCart(lineId) {
  _saveCart(getCart().filter(i => (i.lineId || i.productId) !== lineId));
}

function setQuantity(lineId, quantity) {
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  if (qty === 0) { removeFromCart(lineId); return; }
  const cart = getCart();
  const idx  = cart.findIndex(i => (i.lineId || i.productId) === lineId);
  if (idx >= 0) { cart[idx].quantity = qty; _saveCart(cart); }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent('bst:cart-updated'));
}

function getCartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

function getCartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

// ─── DISPLAY ──────────────────────────────────────────────────────────────────
function formatPrice(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(amount / 100);
}

function updateCartNav() {
  const count = getCartCount();
  document.querySelectorAll('.cart-nav-link').forEach(el => {
    el.textContent = count > 0 ? 'Cart (' + count + ')' : 'Cart';
  });
}

window.addEventListener('bst:cart-updated', updateCartNav);
document.addEventListener('DOMContentLoaded', updateCartNav);
