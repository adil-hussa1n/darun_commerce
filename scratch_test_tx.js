async function testTransactions() {
  const prodUrl = 'https://sheetdb.io/api/v1/lvu6y3uv1dfkv';
  const salesUrl = 'https://sheetdb.io/api/v1/0guuhsgnq809k';

  // 1. Fetch current products to find a valid ID
  console.log('Fetching products...');
  let products = [];
  try {
    const res = await fetch(prodUrl);
    products = await res.json();
    console.log('Fetched products:', products);
  } catch (err) {
    console.error('Error fetching products:', err);
    return;
  }

  if (products.length === 0) {
    console.log('No products found. Please add a product first via the UI or check your columns.');
    return;
  }

  const firstProduct = products[0];
  const productId = firstProduct.id;
  console.log(`Using product ID: "${productId}" for test update...`);

  // 2. Test PATCH update (cut stock)
  // Let's try updating stock to 8
  const patchUrl = `${prodUrl}/id/${productId}`;
  console.log(`Sending PATCH to: ${patchUrl}`);
  try {
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { stock: '8' }
      })
    });
    console.log('PATCH response status:', res.status);
    const text = await res.text();
    console.log('PATCH response body:', text);
  } catch (err) {
    console.error('Error in PATCH:', err);
  }

  // 3. Test POST sale
  console.log('Sending POST to sales...');
  const newSale = {
    sale_id: `sale_test_${Date.now()}`,
    product_name: firstProduct.name || 'Test Glow Serum',
    category: firstProduct.category || 'Skin Care',
    quantity: '2',
    unit_price: '20.00',
    total_price: '40.00',
    date: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  try {
    const res = await fetch(salesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [newSale]
      })
    });
    console.log('POST Sales response status:', res.status);
    const text = await res.text();
    console.log('POST Sales response body:', text);
  } catch (err) {
    console.error('Error in POST sales:', err);
  }
}

testTransactions();
