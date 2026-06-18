import fs from 'fs';

// Mock localStorage for Node environment compatibility
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value.toString(); },
  clear() { this.store = {}; }
};

// Read .env from f:\GITHUB\darun commerce\darun_commerce\.env
const envContent = fs.readFileSync('f:/GITHUB/darun commerce/darun_commerce/.env', 'utf8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

// Set process env variables before importing API module
process.env.VITE_SUPABASE_URL = supabaseUrl;
process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;

async function runTests() {
  console.log('=== Starting Final API Smoothness Test ===');
  console.log('Using Supabase URL:', supabaseUrl);
  
  // Dynamically import API functions after environment variables are set
  const api = await import('../src/services/api.js');
  const { 
    getProducts, 
    addProduct, 
    updateProduct, 
    sellMultipleProducts, 
    getSalesHistory 
  } = api;

  // Test 1: Fetch Products
  console.log('\n[Test 1] Testing getProducts()...');
  const t1Start = Date.now();
  const products = await getProducts();
  const t1End = Date.now();
  console.log(`getProducts() completed in ${t1End - t1Start}ms. Returned ${products.length} items.`);
  
  if (products.length === 0) {
    console.log('No products found in DB. Test complete.');
    return;
  }
  
  // Test 2: Add Product
  console.log('\n[Test 2] Testing addProduct()...');
  const t2Start = Date.now();
  const newProductPayload = {
    serial_no: 'SN-AUTO-' + Date.now(),
    category: 'Skin Care',
    brand: 'Test Brand',
    name: 'Integrity Test Product ' + Date.now(),
    model_barcode: 'BAR-TEST-123',
    ml_mg: '100ml',
    buy_price: '500.00',
    sell_price: '1000.00',
    stock: '20'
  };
  const addRes = await addProduct(newProductPayload);
  const t2End = Date.now();
  console.log(`addProduct() completed in ${t2End - t2Start}ms! Result:`, addRes);

  // Test 3: Update Product
  console.log('\n[Test 3] Testing updateProduct()...');
  const targetProduct = products[0];
  console.log(`Updating product: "${targetProduct.name}" (ID: ${targetProduct.id})`);
  const t3Start = Date.now();
  const updatePayload = {
    ...targetProduct,
    stock: (targetProduct.stock + 5).toString(),
    ml_mg: '250ml'
  };
  const updateRes = await updateProduct(targetProduct.id, updatePayload);
  const t3End = Date.now();
  console.log(`updateProduct() completed in ${t3End - t3Start}ms! Result:`, updateRes);

  // Test 4: Checkout / Sell Products
  console.log('\n[Test 4] Testing sellMultipleProducts() [Checkout]...');
  const t4Start = Date.now();
  const cartItem = {
    ...products[0],
    quantity: 1
  };
  const checkoutRes = await sellMultipleProducts(
    [cartItem],
    '01711223344',
    100, // ৳100 discount
    'bKash' // Payment method
  );
  const t4End = Date.now();
  console.log(`sellMultipleProducts() completed in ${t4End - t4Start}ms! Result:`, checkoutRes);

  // Test 5: Fetch Sales History
  console.log('\n[Test 5] Testing getSalesHistory()...');
  const t5Start = Date.now();
  const salesHistory = await getSalesHistory();
  const t5End = Date.now();
  console.log(`getSalesHistory() completed in ${t5End - t5Start}ms. Returned ${salesHistory.length} items.`);

  console.log('\n=== All API Calls Executed Smoothly and Fast! ===');
}

runTests().catch(err => {
  console.error('\n!!! API Test Failed with Error !!!\n', err);
  process.exit(1);
});
