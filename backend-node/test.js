/**
 * test.js — Full System Integration Test
 * 
 * Runs a complete end-to-end smoke test of the LayerForge 3D backend.
 * Run this script using Node.js v18+ (which includes the built-in fetch API).
 * 
 * Usage:
 *   node test.js
 * 
 * Or test against localhost:
 *   API_URL=http://localhost:8080 node test.js
 */

const API_URL = process.env.API_URL || 'https://threedink-studio.onrender.com';
let authToken = '';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    ...options.headers,
  };
  
  // Auto-attach auth token if we have one
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Auto-set JSON content-type if body is an object and not FormData
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { ...options, headers });
  
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { text }; }

  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log(`\n🚀 Starting full system test against: ${API_URL}`);
  
  /* -------------------------------------------------------------------------- */
  /* 1. HEALTH CHECK                                                          */
  /* -------------------------------------------------------------------------- */
  console.log('\n[1/7] Health Check...');
  let res = await request('/health');
  if (!res.ok) throw new Error('Health check failed: ' + JSON.stringify(res.data));
  console.log('✅ Server is up:', res.data.timestamp);

  /* -------------------------------------------------------------------------- */
  /* 2. AUTHENTICATION (Register & Login)                                     */
  /* -------------------------------------------------------------------------- */
  console.log('\n[2/7] Authentication...');
  const ts = Date.now();
  const testUser = {
    fullName: 'Test Automation User',
    email: `test_${ts}@example.com`,
    password: 'Password123!' // Matches strong password policy
  };

  res = await request('/auth/register', { method: 'POST', body: testUser });
  if (!res.ok && res.status !== 409) throw new Error('Registration failed: ' + JSON.stringify(res.data));
  console.log('✅ Registered user:', testUser.email);

  res = await request('/auth/login', { method: 'POST', body: { email: testUser.email, password: testUser.password } });
  if (!res.ok) throw new Error('Login failed: ' + JSON.stringify(res.data));
  authToken = res.data.token;
  console.log('✅ Logged in successfully. Token acquired.');

  /* -------------------------------------------------------------------------- */
  /* 3. PRODUCTS                                                              */
  /* -------------------------------------------------------------------------- */
  console.log('\n[3/7] Fetching Products...');
  res = await request('/api/products');
  if (!res.ok) throw new Error('Failed to fetch products: ' + JSON.stringify(res.data));
  const products = res.data;
  console.log(`✅ Fetched ${products.length} products.`);

  let targetProductId = null;
  let targetProductName = 'Test Item';
  let targetProductPrice = 10;

  if (products.length > 0) {
    targetProductId = products[0]._id;
    targetProductName = products[0].name;
    targetProductPrice = products[0].price;
  }

  /* -------------------------------------------------------------------------- */
  /* 4. CART                                                                  */
  /* -------------------------------------------------------------------------- */
  console.log('\n[4/7] Shopping Cart...');
  if (!targetProductId) {
    console.log('⚠️ No products found in DB. Skipping Add-to-Cart test.');
  } else {
    // Note: /cart is expecting multipart form-data because of uploadImage.single('customFile')
    // We will use FormData here
    const cartForm = new FormData();
    cartForm.append('productId', targetProductId);
    cartForm.append('quantity', '2');

    res = await request('/cart', { method: 'POST', body: cartForm });
    if (!res.ok) throw new Error('Failed to add to cart: ' + JSON.stringify(res.data));
    console.log('✅ Added item to cart.');
  }

  res = await request('/cart');
  if (!res.ok) throw new Error('Failed to fetch cart: ' + JSON.stringify(res.data));
  console.log(`✅ Cart fetched. Contains ${res.data.items?.length || 0} unique items.`);

  /* -------------------------------------------------------------------------- */
  /* 5. SHOP ORDERS                                                           */
  /* -------------------------------------------------------------------------- */
  console.log('\n[5/7] Placing Shop Order...');
  const orderPayload = {
    shippingAddress: '123 Test Street, Test City, 12345',
    items: [
      {
        productId: targetProductId || '000000000000000000000000',
        productName: targetProductName,
        quantity: 1,
        price: targetProductPrice
      }
    ]
  };
  
  res = await request('/orders', { method: 'POST', body: orderPayload });
  if (!res.ok) throw new Error('Failed to place order: ' + JSON.stringify(res.data));
  console.log('✅ Order placed successfully! Order ID:', res.data._id || res.data.order?._id);

  /* -------------------------------------------------------------------------- */
  /* 6. STL UPLOADS                                                           */
  /* -------------------------------------------------------------------------- */
  console.log('\n[6/7] STL Custom 3D Print Order...');
  const stlForm = new FormData();
  stlForm.append('name', testUser.fullName);
  stlForm.append('email', testUser.email);
  stlForm.append('phone', '123-456-7890');
  stlForm.append('address', '123 Test Street, Test City, 12345');
  stlForm.append('material', 'PLA');
  stlForm.append('quantity', '5');
  
  // Create a dummy text file to simulate an STL file
  const dummyFile = new Blob(['solid test\n  facet normal 0 0 0\n  endfacet\nendsolid test'], { type: 'text/plain' });
  stlForm.append('file', dummyFile, 'test.stl');

  res = await request('/api/uploads/stl', { method: 'POST', body: stlForm });
  if (!res.ok) throw new Error('Failed to upload STL order: ' + JSON.stringify(res.data));
  console.log('✅ STL File uploaded and print order placed! STL Order ID:', res.data.stlOrderId);

  /* -------------------------------------------------------------------------- */
  /* 7. CLEANUP                                                               */
  /* -------------------------------------------------------------------------- */
  console.log('\n[7/7] Cleanup (Emptying Cart)...');
  res = await request('/cart', { method: 'DELETE' });
  console.log('✅ Cart cleared.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED!');
  console.error(err.message);
  process.exit(1);
});
