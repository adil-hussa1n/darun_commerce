import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from environment variables (supporting both Vite and Node.js environments)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '')) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '')) || '';

// Check if Supabase project is configured in .env
export const isSupabaseConfigured = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.onLine === false) {
    return false;
  }
  return (typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '') &&
         (typeof supabaseAnonKey === 'string' && supabaseAnonKey.trim() !== '');
};

// Maintain compatibility with Layout.jsx which uses isApiConfigured
export const isApiConfigured = () => {
  return isSupabaseConfigured();
};

// Initialize Supabase Client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial Dummy Data for local state fallback
const DUMMY_PRODUCTS = [
  {
    id: 'prod_1',
    serial_no: 'SN-001',
    category: 'Skin Care',
    brand: 'The Ordinary',
    name: 'Rosewater Hydrating Mist',
    model_barcode: 'BAR-001',
    ml_mg: '100ml',
    buy_price: '8.00',
    sell_price: '180.00',
    stock: '12',
    created_at: '2026-05-20 10:00:00'
  },
  {
    id: 'prod_2',
    serial_no: 'SN-002',
    category: 'Skin Care',
    brand: 'Cerave',
    name: 'Glow Vitamin C Serum',
    model_barcode: 'BAR-002',
    ml_mg: '30ml',
    buy_price: '12.00',
    sell_price: '280.00',
    stock: '3',
    created_at: '2026-05-21 11:30:00'
  },
  {
    id: 'prod_3',
    serial_no: 'SN-003',
    category: 'Hair Care',
    brand: 'Argan Oil Co.',
    name: 'Argan Oil Hair Mask',
    model_barcode: 'BAR-003',
    ml_mg: '200ml',
    buy_price: '9.50',
    sell_price: '220.00',
    stock: '8',
    created_at: '2026-05-22 09:15:00'
  },
  {
    id: 'prod_4',
    serial_no: 'SN-004',
    category: 'Body Care',
    brand: 'Shea Moisture',
    name: 'Coconut & Shea Body Butter',
    model_barcode: 'BAR-004',
    ml_mg: '250ml',
    buy_price: '6.00',
    sell_price: '150.00',
    stock: '4',
    created_at: '2026-05-23 14:20:00'
  },
  {
    id: 'prod_5',
    serial_no: 'SN-005',
    category: 'Skin Care',
    brand: 'Cetaphil',
    name: 'Gentle Oatmeal Cleanser',
    model_barcode: 'BAR-005',
    ml_mg: '150ml',
    buy_price: '5.50',
    sell_price: '140.00',
    stock: '15',
    created_at: '2026-05-24 08:45:00'
  },
  {
    id: 'prod_6',
    serial_no: 'SN-006',
    category: 'Hair Care',
    brand: 'Tea Tree Special',
    name: 'Tea Tree Purifying Shampoo',
    model_barcode: 'BAR-006',
    ml_mg: '400ml',
    buy_price: '7.00',
    sell_price: '165.50',
    stock: '2',
    created_at: '2026-05-25 12:00:00'
  }
];

const DUMMY_SALES = [
  {
    sale_id: 'sale_1',
    product_name: 'Glow Vitamin C Serum',
    category: 'Skin Care',
    quantity: '2',
    unit_price: '280.00',
    total_price: '560.00',
    date: '2026-05-24 16:40:00'
  },
  {
    sale_id: 'sale_2',
    product_name: 'Rosewater Hydrating Mist',
    category: 'Skin Care',
    quantity: '1',
    unit_price: '180.00',
    total_price: '180.00',
    date: '2026-05-25 10:15:00'
  }
];

// LocalStorage helpers to simulate database operations
const getLocalData = (key, initial) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateNumericId = () => {
  return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
};

// Helper to retrieve local product listings as a fallback
const getLocalProductsFallback = () => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);
  return products.map((p, idx) => {
    const rawId = (p.id || '').toString().trim();
    let finalId = rawId;
    if (!finalId) {
      const pName = (p.name || '').toString().trim();
      if (pName) {
        let hash = 0;
        for (let i = 0; i < pName.length; i++) {
          hash = (hash << 5) - hash + pName.charCodeAt(i);
          hash |= 0;
        }
        finalId = `prod_sh_${Math.abs(hash)}`;
      } else {
        finalId = `prod_gen_${idx}_${Date.now()}`;
      }
    }
    return {
      ...p,
      id: finalId,
      buy_price: parseFloat(p.buy_price || 0),
      sell_price: parseFloat(p.sell_price || 0),
      stock: parseInt(p.stock || 0, 10),
      image: '/logo.png'
    };
  });
};

// Helper to retrieve local sales listings as a fallback
const getLocalSalesFallback = () => {
  const sales = getLocalData('uk_sales', DUMMY_SALES);
  return sales.map(s => ({
    ...s,
    id: s.id ? s.id.toString() : (s.sale_id ? s.sale_id.toString() : `sale_${Date.now()}`),
    quantity: parseInt(s.quantity || 0, 10),
    unit_price: parseFloat(s.unit_price || 0),
    total_price: parseFloat(s.total_price || 0)
  }));
};

// Helper to append unsynced updates offline
const queueLocalProductUpdate = (productId, updatedProduct) => {
  const updates = getLocalData('unsynced_product_updates', []);
  const filtered = updates.filter(u => u.productId !== productId);
  filtered.push({ productId, updatedProduct });
  saveLocalData('unsynced_product_updates', filtered);
};

// Helper to append unsynced sales offline
const queueLocalCheckout = (cartItems, customerPhone, discount, paymentMethod, dateStr, batchTimestamp) => {
  const checkouts = getLocalData('unsynced_checkouts', []);
  checkouts.push({
    cartItems,
    customerPhone,
    discount,
    paymentMethod,
    date: dateStr,
    batchTimestamp
  });
  saveLocalData('unsynced_checkouts', checkouts);
};

// Helper to perform product addition locally
const executeLocalAddProductDirect = (formattedProduct) => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);
  const newProduct = { ...formattedProduct, synced: false };
  products.unshift(newProduct);
  saveLocalData('uk_products', products);
  return { created: 1, local: true };
};

// Helper to compute difference between old and new product fields
const getProductDiff = (oldProd, newProd) => {
  const changes = {};
  const fields = ['name', 'category', 'buy_price', 'sell_price', 'stock', 'serial_no', 'brand', 'model_barcode', 'ml_mg'];
  fields.forEach(field => {
    let oldVal = oldProd[field];
    let newVal = newProd[field];

    // Normalize comparison for numbers vs strings
    if (field === 'buy_price' || field === 'sell_price') {
      oldVal = parseFloat(oldVal || 0).toFixed(2);
      newVal = parseFloat(newVal || 0).toFixed(2);
    } else if (field === 'stock') {
      oldVal = parseInt(oldVal || 0, 10);
      newVal = parseInt(newVal || 0, 10);
    } else {
      oldVal = (oldVal || '').toString().trim();
      newVal = (newVal || '').toString().trim();
    }

    if (oldVal !== newVal) {
      changes[field] = { old: oldVal, new: newVal };
    }
  });
  return changes;
};

// Helper to perform local product update and log edit
const executeLocalUpdateProduct = (productId, updatedProduct) => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);
  const oldProduct = products.find(p => p.id === productId);
  if (!oldProduct) return { success: false, error: 'Product not found' };

  const diff = getProductDiff(oldProduct, updatedProduct);

  const index = products.findIndex(p => p.id === productId);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updatedProduct,
      buy_price: parseFloat(updatedProduct.buy_price || 0),
      sell_price: parseFloat(updatedProduct.sell_price || 0),
      stock: parseInt(updatedProduct.stock || 0, 10),
    };
    saveLocalData('uk_products', products);
  }

  // Queue product update to be synced later
  queueLocalProductUpdate(productId, updatedProduct);

  // Only log if there are actual changes
  if (Object.keys(diff).length > 0) {
    const edits = getLocalData('uk_product_edits', []);
    const editLog = {
      id: `edit_${Date.now()}`,
      product_id: productId,
      product_name: updatedProduct.name,
      changes: diff,
      edited_at: new Date().toISOString()
    };
    edits.unshift(editLog);
    saveLocalData('uk_product_edits', edits);
  }

  return { success: true, local: true };
};

// Helper to perform checkout / stock reduction locally
const executeLocalCheckout = (cartItems, customerPhone, discount = 0, paymentMethod = 'Cash') => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);

  // Verify stock
  for (const item of cartItems) {
    const product = products.find(p => {
      const pId = (p.id || '').toString().trim();
      if (pId && pId === item.id) return true;
      if (!pId && item.id.startsWith('prod_sh_')) {
        const pName = (p.name || '').toString().trim();
        let hash = 0;
        for (let i = 0; i < pName.length; i++) {
          hash = (hash << 5) - hash + pName.charCodeAt(i);
          hash |= 0;
        }
        const generatedId = `prod_sh_${Math.abs(hash)}`;
        if (generatedId === item.id) return true;
      }
      return false;
    });

    if (!product) throw new Error(`Product "${item.name}" not found`);
    const currentStock = parseInt(product.stock || 0, 10);
    if (currentStock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Only ${currentStock} left.`);
    }
  }

  // Cut stock
  for (const item of cartItems) {
    const product = products.find(p => {
      const pId = (p.id || '').toString().trim();
      if (pId && pId === item.id) return true;
      if (!pId && item.id.startsWith('prod_sh_')) {
        const pName = (p.name || '').toString().trim();
        let hash = 0;
        for (let i = 0; i < pName.length; i++) {
          hash = (hash << 5) - hash + pName.charCodeAt(i);
          hash |= 0;
        }
        const generatedId = `prod_sh_${Math.abs(hash)}`;
        if (generatedId === item.id) return true;
      }
      return false;
    });
    product.stock = (parseInt(product.stock || 0, 10) - item.quantity).toString();
  }
  saveLocalData('uk_products', products);

  // Save logs
  const sales = getLocalData('uk_sales', DUMMY_SALES);
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const batchTimestamp = Date.now();

  const totalCartVal = cartItems.reduce((sum, item) => sum + (parseFloat(item.sell_price) * item.quantity), 0);

  cartItems.forEach((item, index) => {
    const itemSubtotal = parseFloat(item.sell_price) * item.quantity;
    const distributedDiscount = totalCartVal > 0 ? (itemSubtotal / totalCartVal) * discount : 0;
    const finalItemTotalPrice = Math.max(0, itemSubtotal - distributedDiscount);

    const newSale = {
      sale_id: `sale_${batchTimestamp}_${index}`,
      product_name: item.name,
      category: item.category || '',
      brand: item.brand || '',
      serial_no: item.serial_no || '',
      model_barcode: item.model_barcode || '',
      ml_mg: item.ml_mg || '',
      quantity: item.quantity.toString(),
      unit_price: parseFloat(item.sell_price).toFixed(2),
      total_price: finalItemTotalPrice.toFixed(2),
      discount: distributedDiscount.toFixed(2),
      payment_method: paymentMethod || 'Cash',
      customer_phone: customerPhone || '',
      date: dateStr
    };
    sales.unshift(newSale);
  });
  saveLocalData('uk_sales', sales);

  // Queue checkout details to sync later
  queueLocalCheckout(cartItems, customerPhone, discount, paymentMethod, dateStr, batchTimestamp);

  return { success: true, local: true };
};

/**
 * ----------------------------------------------------
 * PRODUCTS OPERATIONS
 * ----------------------------------------------------
 */

// Fetch all products
export const getProducts = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('uk_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p, idx) => {
        const rawId = (p.id || '').toString().trim();
        const pName = (p.name || '').toString().trim();

        let finalId = rawId;
        if (!finalId) {
          if (pName) {
            let hash = 0;
            for (let i = 0; i < pName.length; i++) {
              hash = (hash << 5) - hash + pName.charCodeAt(i);
              hash |= 0;
            }
            finalId = `prod_sh_${Math.abs(hash)}`;
          } else {
            finalId = `prod_gen_${idx}_${Date.now()}`;
          }
        }

        return {
          id: finalId,
          name: pName || 'Untitled Product',
          category: p.category || '',
          brand: p.brand || '',
          serial_no: p.serial_no || '',
          model_barcode: p.model_barcode || '',
          ml_mg: p.ml_mg || '',
          buy_price: parseFloat(p.buy_price || 0),
          sell_price: parseFloat(p.sell_price || 0),
          stock: parseInt(p.stock || 0, 10),
          created_at: p.created_at || '',
          image: '/logo.png'
        };
      });
    } catch (error) {
      console.warn('Error fetching products from Supabase, falling back to local storage:', error.message);
      return getLocalProductsFallback();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalProductsFallback();
  }
};

// Add a single product
export const addProduct = async (productData) => {
  const formattedProduct = {
    id: `prod_${Date.now()}`,
    serial_no: productData.serial_no || '',
    category: productData.category || '',
    brand: productData.brand || '',
    name: productData.name,
    model_barcode: productData.model_barcode || '',
    ml_mg: productData.ml_mg || '',
    buy_price: parseFloat(parseFloat(productData.buy_price || 0).toFixed(2)),
    sell_price: parseFloat(parseFloat(productData.sell_price || 0).toFixed(2)),
    stock: parseInt(productData.stock || 0, 10),
    image: '/logo.png',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_products')
        .insert([formattedProduct]);

      if (error) throw error;
      return { created: 1 };
    } catch (error) {
      console.warn('Error adding product to Supabase, falling back locally:', error.message);
      return executeLocalAddProductDirect(formattedProduct);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalAddProductDirect(formattedProduct);
  }
};

/**
 * ----------------------------------------------------
 * TRANSACTION / SALES OPERATIONS
 * ----------------------------------------------------
 */

// Sell a single product (update stock & create transaction log)
export const sellProduct = async (productId, quantityToSell) => {
  return sellMultipleProducts([{ id: productId, quantity: quantityToSell }]);
};

// Sell multiple products at a time (Cart Checkout)
export const sellMultipleProducts = async (cartItems, customerPhone, discount = 0, paymentMethod = 'Cash') => {
  if (cartItems.length === 0) {
    throw new Error('No items in checkout list');
  }

  if (isSupabaseConfigured()) {
    try {
      const batchTimestamp = Date.now();
      const formattedItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      // Try atomic RPC checkout first
      const { error: rpcErr } = await supabase.rpc('execute_checkout', {
        p_customer_phone: customerPhone || '',
        p_payment_method: paymentMethod || 'Cash',
        p_discount: parseFloat(discount),
        p_batch_id: `sale_${batchTimestamp}`,
        p_cart_items: formattedItems
      });

      // If RPC is successful, return success
      if (!rpcErr) {
        return { success: true };
      }

      // If RPC error indicates the function doesn't exist, log warning and run legacy client-side fallback
      const fnNotExist = rpcErr.message && (
        rpcErr.message.includes('does not exist') ||
        rpcErr.message.includes('not found') ||
        rpcErr.code === '42883'
      );

      if (fnNotExist) {
        console.warn('RPC execute_checkout not found on database. Falling back to legacy client checkout.');
      } else {
        // For other database errors (e.g. stock validation failures from PostgreSQL), throw the error
        throw rpcErr;
      }

      // ─── LEGACY CLIENT-SIDE CHECKOUT (FALLBACK) ───
      // 1. Fetch current raw products to check stock
      const { data: dbProducts, error: fetchErr } = await supabase
        .from('uk_products')
        .select('*');

      if (fetchErr) throw fetchErr;

      // Perform validation and prepare updates
      const stockUpdates = [];
      for (const item of cartItems) {
        // Find product in DB. Support matching by either direct ID or by name-hash
        const product = dbProducts.find(p => {
          const dbId = (p.id || '').toString().trim();
          const dbName = (p.name || '').toString().trim();

          if (dbId && dbId === item.id) return true;

          if (!dbId && item.id.startsWith('prod_sh_')) {
            let hash = 0;
            for (let i = 0; i < dbName.length; i++) {
              hash = (hash << 5) - hash + dbName.charCodeAt(i);
              hash |= 0;
            }
            const generatedId = `prod_sh_${Math.abs(hash)}`;
            if (generatedId === item.id) return true;
          }
          return false;
        });

        if (!product) {
          throw new Error(`Product "${item.name}" not found in database.`);
        }

        const currentStock = parseInt(product.stock || 0, 10);
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${currentStock} left.`);
        }

        const dbId = (product.id || '').toString().trim();
        stockUpdates.push({
          productId: item.id,
          dbProductId: dbId || null,
          isGeneratedId: !dbId,
          originalName: product.name,
          newStock: currentStock - item.quantity,
          name: product.name,
          category: product.category || '',
          brand: product.brand || '',
          serial_no: product.serial_no || '',
          model_barcode: product.model_barcode || '',
          ml_mg: product.ml_mg || '',
          unitPrice: parseFloat(product.sell_price || 0),
          buyPrice: parseFloat(product.buy_price || 0),
          qtySold: item.quantity
        });
      }

      // Calculate total cart value to distribute discount proportionally
      const totalCartVal = stockUpdates.reduce((sum, update) => sum + (update.unitPrice * update.qtySold), 0);

      // 2. Insert transaction records into Supabase customer_sales (canonical sales table)
      // product_id column is TEXT, so the original product id string is preserved.
      const customerSalesRows = stockUpdates.map((update, index) => {
        const itemSubtotal = update.unitPrice * update.qtySold;
        const distributedDiscount = totalCartVal > 0 ? (itemSubtotal / totalCartVal) * discount : 0;
        const finalItemTotalPrice = Math.max(0, itemSubtotal - distributedDiscount);

        return {
          product_id: (update.dbProductId || update.productId || '').toString(),
          customer_phone: customerPhone || '',
          quantity: update.qtySold,
          total_price: parseFloat(finalItemTotalPrice.toFixed(2)),
          discount: parseFloat(distributedDiscount.toFixed(2)),
          payment_method: paymentMethod || 'Cash',
          sale_id: `sale_${batchTimestamp}_${index}`,
          brand: update.brand || '',
          serial_no: update.serial_no || '',
          model_barcode: update.model_barcode || '',
          ml_mg: update.ml_mg || '',
          product_name_snapshot: update.name,
          category_snapshot: update.category,
          sell_price_snapshot: update.unitPrice,
          buy_price_snapshot: update.buyPrice
        };
      });

      let { error: salesInsertErr } = await supabase
        .from('customer_sales')
        .insert(customerSalesRows);

      // Backward-compatible retry: drop sale_id, discount, payment_method columns if they haven't been added yet
      if (salesInsertErr && salesInsertErr.message) {
        const hasSaleIdErr = salesInsertErr.message.includes('sale_id');
        const hasDiscountErr = salesInsertErr.message.includes('discount');
        const hasPayMethodErr = salesInsertErr.message.includes('payment_method');

        if (hasSaleIdErr || hasDiscountErr || hasPayMethodErr) {
          console.warn('Newer columns not found in customer_sales schema. Retrying insertion with fallback schema.');
          const fallbackRows = customerSalesRows.map(row => {
            const { sale_id, discount, payment_method, ...rest } = row;
            return rest;
          });
          const { error: retryErr } = await supabase
            .from('customer_sales')
            .insert(fallbackRows);
          salesInsertErr = retryErr;
        }
      }

      if (salesInsertErr) throw salesInsertErr;

      // 3. Perform Stock Reduction calls in parallel
      await Promise.all(
        stockUpdates.map(async (update) => {
          let query = supabase.from('uk_products').update({ stock: update.newStock });

          if (update.isGeneratedId) {
            query = query.eq('name', update.originalName);
          } else {
            query = query.eq('id', update.dbProductId || update.productId);
          }

          const { error: patchErr } = await query;
          if (patchErr) throw patchErr;
        })
      );

      return { success: true };
    } catch (error) {
      console.error('Error executing batch sales in Supabase, falling back locally:', error.message);
      return executeLocalCheckout(cartItems, customerPhone, discount, paymentMethod);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalCheckout(cartItems, customerPhone, discount, paymentMethod);
  }
};

// Update an existing product and log its edit details
export const updateProduct = async (productId, productData) => {
  const formattedProduct = {
    serial_no: productData.serial_no || '',
    category: productData.category || '',
    brand: productData.brand || '',
    name: productData.name,
    model_barcode: productData.model_barcode || '',
    ml_mg: productData.ml_mg || '',
    buy_price: parseFloat(parseFloat(productData.buy_price || 0).toFixed(2)),
    sell_price: parseFloat(parseFloat(productData.sell_price || 0).toFixed(2)),
    stock: parseInt(productData.stock || 0, 10),
    image: '/logo.png'
  };

  if (isSupabaseConfigured()) {
    try {
      // 1. Fetch current product state to calculate diff
      const { data: currentProduct, error: fetchErr } = await supabase
        .from('uk_products')
        .select('*')
        .eq('id', productId)
        .single();

      let diff = {};
      if (!fetchErr && currentProduct) {
        diff = getProductDiff(currentProduct, formattedProduct);
      }

      // 2. Update the product in uk_products
      const { error: updateErr } = await supabase
        .from('uk_products')
        .update(formattedProduct)
        .eq('id', productId);

      if (updateErr) throw updateErr;

      // 3. Insert diff into uk_product_edits if any changes were made
      if (Object.keys(diff).length > 0) {
        const { error: editLogErr } = await supabase
          .from('uk_product_edits')
          .insert([{
            product_id: productId,
            product_name: formattedProduct.name,
            changes: diff
          }]);

        if (editLogErr) {
          console.warn('Could not log edit to Supabase uk_product_edits:', editLogErr.message);
        }
      }

      // Also sync locally
      executeLocalUpdateProduct(productId, formattedProduct);

      return { success: true };
    } catch (error) {
      console.warn('Error updating product in Supabase, falling back locally:', error.message);
      return executeLocalUpdateProduct(productId, formattedProduct);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalUpdateProduct(productId, formattedProduct);
  }
};

// Fetch sales transaction history
// Sales are persisted in `customer_sales` (the canonical source). We enrich the rows
// with product info (name, category, unit price) by looking them up in `uk_products`.
export const getSalesHistory = async () => {
  if (isSupabaseConfigured()) {
    try {
      const [salesRes, productsRes] = await Promise.all([
        supabase
          .from('customer_sales')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('uk_products')
          .select('id, name, category, sell_price')
      ]);

      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) {
        console.warn('Could not load products for sales join:', productsRes.error.message);
      }

      const products = productsRes.data || [];
      const productMap = {};
      products.forEach(p => {
        const pid = (p.id || '').toString().trim();
        if (!pid) return;
        productMap[pid] = p;
        // Legacy compatibility: older rows may have only the digit-suffix of `prod_<ts>`
        const digits = pid.replace(/\D/g, '');
        if (digits && !productMap[digits]) {
          productMap[digits] = p;
        }
      });

      const dbSales = (salesRes.data || []).map(s => {
        const productIdStr = (s.product_id || '').toString().trim();
        const product = productMap[productIdStr]
          || productMap[productIdStr.replace(/\D/g, '')];

        const quantity = parseInt(s.quantity || 0, 10);
        const totalPrice = parseFloat(s.total_price || 0);
        const unitPrice = quantity > 0
          ? (product ? parseFloat(product.sell_price || 0) : totalPrice / quantity)
          : 0;

        return {
          id: s.id.toString(),
          sale_id: s.sale_id || `sale_${s.id}`,
          product_name: (s.product_name_snapshot || '').trim() || (product ? product.name : (productIdStr || 'Unknown Product')),
          category: (s.category_snapshot || '').trim() || (product ? (product.category || '') : ''),
          quantity,
          unit_price: s.sell_price_snapshot !== undefined && s.sell_price_snapshot !== null
            ? parseFloat(s.sell_price_snapshot)
            : unitPrice,
          buy_price_snapshot: s.buy_price_snapshot !== undefined && s.buy_price_snapshot !== null
            ? parseFloat(s.buy_price_snapshot)
            : null,
          sell_price_snapshot: s.sell_price_snapshot !== undefined && s.sell_price_snapshot !== null
            ? parseFloat(s.sell_price_snapshot)
            : null,
          total_price: totalPrice,
          discount: parseFloat(s.discount || 0),
          payment_method: s.payment_method || 'Cash',
          customer_phone: s.customer_phone || '',
          date: s.created_at || '',
        };
      });

      // Merge local unsynced checkouts
      const unsyncedCheckouts = getLocalData('unsynced_checkouts', []);
      const unsyncedSales = [];

      unsyncedCheckouts.forEach(checkout => {
        const { cartItems, customerPhone, discount, paymentMethod, date, batchTimestamp } = checkout;
        const totalCartVal = cartItems.reduce((sum, item) => sum + (parseFloat(item.sell_price || 0) * item.quantity), 0);

        cartItems.forEach((item, index) => {
          const itemSubtotal = parseFloat(item.sell_price || 0) * item.quantity;
          const distributedDiscount = totalCartVal > 0 ? (itemSubtotal / totalCartVal) * discount : 0;
          const finalItemTotalPrice = Math.max(0, itemSubtotal - distributedDiscount);

          unsyncedSales.push({
            id: `local_unsynced_${batchTimestamp}_${index}`,
            sale_id: `sale_${batchTimestamp}_${index}`,
            product_name: item.name,
            category: item.category || '',
            quantity: item.quantity,
            unit_price: parseFloat(item.sell_price || 0),
            buy_price_snapshot: parseFloat(item.buy_price || 0),
            sell_price_snapshot: parseFloat(item.sell_price || 0),
            total_price: finalItemTotalPrice,
            discount: distributedDiscount,
            payment_method: paymentMethod || 'Cash',
            customer_phone: customerPhone || '',
            date: date || new Date(batchTimestamp).toISOString(),
            pendingSync: true
          });
        });
      });

      const merged = [...unsyncedSales, ...dbSales];
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));
      return merged;
    } catch (error) {
      console.warn('Error fetching sales history from Supabase, falling back to local storage:', error.message);
      return getLocalSalesFallback();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalSalesFallback();
  }
};

/**
 * ----------------------------------------------------
 * EXPENSES OPERATIONS
 * ----------------------------------------------------
 */

// Fetch all expenses
export const getExpenses = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('uk_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const dbExpenses = (data || []).map(exp => ({
        id: exp.id.toString(),
        name: exp.name || '',
        amount: parseFloat(exp.amount || 0),
        transaction_type: exp.transaction_type || 'Cash',
        created_at: exp.created_at || ''
      }));

      const localExpenses = getLocalData('uk_expenses', []);
      const unsyncedAdditions = localExpenses.filter(e => e.synced === false);
      const unsyncedUpdates = getLocalData('unsynced_expense_updates', []);

      let merged = [...dbExpenses];

      // Apply updates
      merged = merged.map(e => {
        const update = unsyncedUpdates.find(u => u.expenseId.toString() === e.id.toString());
        if (update) {
          return { ...e, ...update.formattedExpense };
        }
        return e;
      });

      // Filter out deleted
      const deletedIds = new Set(getLocalData('deleted_expense_ids', []));
      merged = merged.filter(e => !deletedIds.has(e.id.toString()));

      // Add additions
      const dbIds = new Set(dbExpenses.map(e => e.id.toString()));
      unsyncedAdditions.forEach(e => {
        if (!dbIds.has(e.id.toString())) {
          merged.unshift(e);
        }
      });

      return merged;
    } catch (error) {
      console.warn('Error fetching expenses from Supabase, falling back to local storage:', error.message);
      return getLocalExpensesFallback();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalExpensesFallback();
  }
};

const getLocalExpensesFallback = () => {
  return getLocalData('uk_expenses', []).map(exp => ({
    ...exp,
    amount: parseFloat(exp.amount || 0)
  }));
};

// Add an expense
export const addExpense = async (expenseData) => {
  const formattedExpense = {
    name: expenseData.name,
    amount: parseFloat(expenseData.amount || 0),
    transaction_type: expenseData.transaction_type || 'Cash',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('uk_expenses')
        .insert([formattedExpense])
        .select();

      if (error) throw error;

      // sync local cache
      const localExpenses = getLocalData('uk_expenses', []);
      const newId = data && data[0] ? data[0].id.toString() : `exp_${Date.now()}`;
      localExpenses.unshift({ ...formattedExpense, id: newId });
      saveLocalData('uk_expenses', localExpenses);

      return { success: true };
    } catch (error) {
      console.warn('Error adding expense to Supabase, falling back locally:', error.message);
      return executeLocalAddExpense(formattedExpense);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalAddExpense(formattedExpense);
  }
};

const executeLocalAddExpense = (formattedExpense) => {
  const localExpenses = getLocalData('uk_expenses', []);
  const newExpense = { ...formattedExpense, id: `exp_${Date.now()}`, synced: false };
  localExpenses.unshift(newExpense);
  saveLocalData('uk_expenses', localExpenses);
  return { success: true, local: true };
};

// Delete an expense
export const deleteExpense = async (expenseId) => {
  if (isSupabaseConfigured()) {
    try {
      const isNumeric = /^\d+$/.test(expenseId.toString());
      const { error } = await supabase
        .from('uk_expenses')
        .delete()
        .eq(isNumeric ? 'id' : 'name', isNumeric ? parseInt(expenseId, 10) : expenseId);

      if (error) {
        const { error: secondErr } = await supabase
          .from('uk_expenses')
          .delete()
          .eq('name', expenseId);
        if (secondErr) throw error;
      }

      executeLocalDeleteExpense(expenseId, false); // NOT offline/local only
      return { success: true };
    } catch (error) {
      console.warn('Error deleting expense from Supabase, falling back locally:', error.message);
      return executeLocalDeleteExpense(expenseId, true); // IS offline/local fallback
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalDeleteExpense(expenseId, true);
  }
};

const executeLocalDeleteExpense = (expenseId, isOffline = false) => {
  const localExpenses = getLocalData('uk_expenses', []);
  const filtered = localExpenses.filter(exp => (exp.id || '').toString() !== (expenseId || '').toString());
  saveLocalData('uk_expenses', filtered);

  if (isOffline) {
    const deletedExpenses = getLocalData('deleted_expense_ids', []);
    if (!deletedExpenses.includes(expenseId.toString())) {
      deletedExpenses.push(expenseId.toString());
      saveLocalData('deleted_expense_ids', deletedExpenses);
    }
  }

  return { success: true, local: true };
};

// Update an expense
export const updateExpense = async (expenseId, expenseData) => {
  const formattedExpense = {
    name: expenseData.name,
    amount: parseFloat(expenseData.amount || 0),
    transaction_type: expenseData.transaction_type || 'Cash'
  };

  if (isSupabaseConfigured()) {
    try {
      const isNumeric = /^\d+$/.test(expenseId.toString());
      const { error } = await supabase
        .from('uk_expenses')
        .update(formattedExpense)
        .eq(isNumeric ? 'id' : 'name', isNumeric ? parseInt(expenseId, 10) : expenseId);

      if (error) throw error;

      executeLocalUpdateExpense(expenseId, formattedExpense);
      return { success: true };
    } catch (error) {
      console.warn('Error updating expense in Supabase, falling back locally:', error.message);
      return executeLocalUpdateExpense(expenseId, formattedExpense);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalUpdateExpense(expenseId, formattedExpense);
  }
};

// Helper to queue expense updates offline
const queueLocalExpenseUpdate = (expenseId, formattedExpense) => {
  if (/^\d+$/.test(expenseId.toString())) {
    const updates = getLocalData('unsynced_expense_updates', []);
    const filtered = updates.filter(u => u.expenseId.toString() !== expenseId.toString());
    filtered.push({ expenseId, formattedExpense });
    saveLocalData('unsynced_expense_updates', filtered);
  } else {
    // If it's a locally created offline expense, make sure its synced: false flag remains
    const localExpenses = getLocalData('uk_expenses', []);
    const idx = localExpenses.findIndex(e => e.id.toString() === expenseId.toString());
    if (idx !== -1) {
      localExpenses[idx].synced = false;
      saveLocalData('uk_expenses', localExpenses);
    }
  }
};

const executeLocalUpdateExpense = (expenseId, formattedExpense) => {
  const localExpenses = getLocalData('uk_expenses', []);
  const index = localExpenses.findIndex(exp => exp.id.toString() === expenseId.toString());
  if (index !== -1) {
    localExpenses[index] = {
      ...localExpenses[index],
      ...formattedExpense
    };
    saveLocalData('uk_expenses', localExpenses);
  }

  // Queue expense update
  queueLocalExpenseUpdate(expenseId, formattedExpense);

  return { success: true, local: true };
};

// Supabase-direct checkout function to help with sync
const executeSupabaseCheckout = async (cartItems, customerPhone, discount, paymentMethod, dateStr, batchTimestamp) => {
  const { data: dbProducts, error: fetchErr } = await supabase
    .from('uk_products')
    .select('*');

  if (fetchErr) throw fetchErr;

  const stockUpdates = [];
  for (const item of cartItems) {
    const product = dbProducts.find(p => {
      const dbId = (p.id || '').toString().trim();
      if (dbId && dbId === item.id) return true;
      return false;
    });

    if (!product) throw new Error(`Product not found`);
    const currentStock = parseInt(product.stock || 0, 10);
    const dbId = (product.id || '').toString().trim();
    stockUpdates.push({
      productId: item.id,
      dbProductId: dbId || null,
      newStock: currentStock - item.quantity,
      name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      serial_no: product.serial_no || '',
      model_barcode: product.model_barcode || '',
      ml_mg: product.ml_mg || '',
      unitPrice: parseFloat(product.sell_price || 0),
      buyPrice: parseFloat(product.buy_price || 0),
      qtySold: item.quantity
    });
  }

  const totalCartVal = stockUpdates.reduce((sum, update) => sum + (update.unitPrice * update.qtySold), 0);

  const customerSalesRows = stockUpdates.map((update, index) => {
    const itemSubtotal = update.unitPrice * update.qtySold;
    const distributedDiscount = totalCartVal > 0 ? (itemSubtotal / totalCartVal) * discount : 0;
    const finalItemTotalPrice = Math.max(0, itemSubtotal - distributedDiscount);

    return {
      product_id: (update.dbProductId || update.productId || '').toString(),
      customer_phone: customerPhone || '',
      quantity: update.qtySold,
      total_price: parseFloat(finalItemTotalPrice.toFixed(2)),
      discount: parseFloat(distributedDiscount.toFixed(2)),
      payment_method: paymentMethod || 'Cash',
      sale_id: `sale_${batchTimestamp}_${index}`,
      brand: update.brand || '',
      serial_no: update.serial_no || '',
      model_barcode: update.model_barcode || '',
      ml_mg: update.ml_mg || '',
      product_name_snapshot: update.name,
      category_snapshot: update.category,
      sell_price_snapshot: update.unitPrice,
      buy_price_snapshot: update.buyPrice,
      created_at: dateStr
    };
  });

  const { error: salesInsertErr } = await supabase
    .from('customer_sales')
    .insert(customerSalesRows);

  if (salesInsertErr) throw salesInsertErr;

  await Promise.all(
    stockUpdates.map(async (update) => {
      const { error: patchErr } = await supabase
        .from('uk_products')
        .update({ stock: update.newStock })
        .eq('id', update.dbProductId || update.productId);
      if (patchErr) throw patchErr;
    })
  );

  return { success: true };
};

// Sync all offline created products, checkouts, and expenses to Supabase
export const syncOfflineData = async () => {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

  let syncCount = 0;

  try {
    // 1. Sync New Products (synced: false)
    const localProducts = getLocalData('uk_products', DUMMY_PRODUCTS);
    const unsyncedProducts = localProducts.filter(p => p.synced === false);
    for (const prod of unsyncedProducts) {
      const { synced, ...supabaseProd } = prod;
      const { error } = await supabase
        .from('uk_products')
        .insert([supabaseProd]);

      if (!error) {
        prod.synced = true;
        syncCount++;
      }
    }
    if (unsyncedProducts.length > 0) {
      saveLocalData('uk_products', localProducts);
    }

    // 2. Sync Product Updates
    const unsyncedUpdates = getLocalData('unsynced_product_updates', []);
    const remainingUpdates = [];
    for (const update of unsyncedUpdates) {
      const { error } = await supabase
        .from('uk_products')
        .update(update.updatedProduct)
        .eq('id', update.productId);

      if (!error) {
        syncCount++;
      } else {
        remainingUpdates.push(update);
      }
    }
    saveLocalData('unsynced_product_updates', remainingUpdates);

    // 3. Sync Checkouts (Sales)
    const unsyncedCheckouts = getLocalData('unsynced_checkouts', []);
    const remainingCheckouts = [];
    for (const checkout of unsyncedCheckouts) {
      try {
        const res = await executeSupabaseCheckout(
          checkout.cartItems,
          checkout.customerPhone,
          checkout.discount,
          checkout.paymentMethod,
          checkout.date,
          checkout.batchTimestamp
        );
        if (res && res.success) {
          syncCount++;
        } else {
          remainingCheckouts.push(checkout);
        }
      } catch (err) {
        remainingCheckouts.push(checkout);
      }
    }
    saveLocalData('unsynced_checkouts', remainingCheckouts);

    // 4. Sync New Expenses (synced: false)
    const localExpenses = getLocalData('uk_expenses', []);
    const unsyncedExpenses = localExpenses.filter(e => e.synced === false);
    for (const exp of unsyncedExpenses) {
      const { synced, id, ...supabaseExp } = exp;
      const { data, error } = await supabase
        .from('uk_expenses')
        .insert([supabaseExp])
        .select();

      if (!error) {
        exp.synced = true;
        if (data && data[0]) {
          exp.id = data[0].id.toString();
        }
        syncCount++;
      }
    }
    if (unsyncedExpenses.length > 0) {
      saveLocalData('uk_expenses', localExpenses);
    }

    // 5. Sync Expense Updates
    const unsyncedExpenseUpdates = getLocalData('unsynced_expense_updates', []);
    const remainingExpUpdates = [];
    for (const update of unsyncedExpenseUpdates) {
      const { error } = await supabase
        .from('uk_expenses')
        .update(update.formattedExpense)
        .eq('id', parseInt(update.expenseId, 10));

      if (!error) {
        syncCount++;
      } else {
        remainingExpUpdates.push(update);
      }
    }
    saveLocalData('unsynced_expense_updates', remainingExpUpdates);

    // 6. Sync New Parties (synced: false)
    const localParties = getLocalData('uk_parties', []);
    const unsyncedParties = localParties.filter(p => p.synced === false);
    for (const party of unsyncedParties) {
      const { synced, ...supabaseParty } = party;
      supabaseParty.id = parseInt(supabaseParty.id, 10);
      const { error } = await supabase
        .from('uk_parties')
        .insert([supabaseParty]);

      if (!error) {
        party.synced = true;
        syncCount++;
      }
    }
    if (unsyncedParties.length > 0) {
      saveLocalData('uk_parties', localParties);
    }

    // 7. Sync Party Updates
    const unsyncedPartyUpdates = getLocalData('unsynced_party_updates', []);
    const remainingPartyUpdates = [];
    for (const update of unsyncedPartyUpdates) {
      const { error } = await supabase
        .from('uk_parties')
        .update(update.formattedParty)
        .eq('id', parseInt(update.partyId, 10));

      if (!error) {
        syncCount++;
      } else {
        remainingPartyUpdates.push(update);
      }
    }
    saveLocalData('unsynced_party_updates', remainingPartyUpdates);

    // 8. Sync New Party Transactions (synced: false)
    const localPartyTxs = getLocalData('uk_party_transactions', []);
    const unsyncedPartyTxs = localPartyTxs.filter(t => t.synced === false);
    for (const tx of unsyncedPartyTxs) {
      const { synced, ...supabaseTx } = tx;
      supabaseTx.id = parseInt(supabaseTx.id, 10);
      supabaseTx.party_id = parseInt(supabaseTx.party_id, 10);
      supabaseTx.amount = parseFloat(supabaseTx.amount);
      const { error } = await supabase
        .from('uk_party_transactions')
        .insert([supabaseTx]);

      if (!error) {
        tx.synced = true;
        syncCount++;
      }
    }
    if (unsyncedPartyTxs.length > 0) {
      saveLocalData('uk_party_transactions', localPartyTxs);
    }

    // 9. Sync Party Transaction Updates
    const unsyncedPartyTxUpdates = getLocalData('unsynced_party_transaction_updates', []);
    const remainingPartyTxUpdates = [];
    for (const update of unsyncedPartyTxUpdates) {
      const { error } = await supabase
        .from('uk_party_transactions')
        .update(update.formattedTx)
        .eq('id', parseInt(update.txId, 10));

      if (!error) {
        syncCount++;
      } else {
        remainingPartyTxUpdates.push(update);
      }
    }
    saveLocalData('unsynced_party_transaction_updates', remainingPartyTxUpdates);

    // 10. Sync Deleted Parties
    const deletedParties = getLocalData('deleted_party_ids', []);
    const remainingDeletedParties = [];
    for (const id of deletedParties) {
      if (/^\d+$/.test(id)) {
        // Delete transactions of this party first to prevent foreign key errors during sync!
        await supabase
          .from('uk_party_transactions')
          .delete()
          .eq('party_id', parseInt(id, 10));

        const { error } = await supabase
          .from('uk_parties')
          .delete()
          .eq('id', parseInt(id, 10));
        if (!error) syncCount++;
        else remainingDeletedParties.push(id);
      }
    }
    saveLocalData('deleted_party_ids', remainingDeletedParties);

    // 11. Sync Deleted Party Transactions
    const deletedTxs = getLocalData('deleted_party_transaction_ids', []);
    const remainingDeletedTxs = [];
    for (const id of deletedTxs) {
      if (/^\d+$/.test(id)) {
        const { error } = await supabase
          .from('uk_party_transactions')
          .delete()
          .eq('id', parseInt(id, 10));
        if (!error) syncCount++;
        else remainingDeletedTxs.push(id);
      }
    }
    saveLocalData('deleted_party_transaction_ids', remainingDeletedTxs);

    // 12. Sync Deleted Expenses
    const deletedExpenses = getLocalData('deleted_expense_ids', []);
    const remainingDeletedExpenses = [];
    for (const id of deletedExpenses) {
      if (/^\d+$/.test(id)) {
        const { error } = await supabase
          .from('uk_expenses')
          .delete()
          .eq('id', parseInt(id, 10));
        if (!error) syncCount++;
        else remainingDeletedExpenses.push(id);
      }
    }
    saveLocalData('deleted_expense_ids', remainingDeletedExpenses);

    // 13. Sync Returns (Added)
    const unsyncedReturns = getLocalData('unsynced_returns', []);
    const remainingReturns = [];
    for (const ret of unsyncedReturns) {
      try {
        const res = await executeSupabaseReturn(
          ret.saleItemId,
          ret.returnedQty,
          ret.refundAmount,
          ret.restockStatus,
          ret.returnId,
          ret.date
        );
        if (res && res.success) {
          syncCount++;
        } else {
          remainingReturns.push(ret);
        }
      } catch (err) {
        remainingReturns.push(ret);
      }
    }
    saveLocalData('unsynced_returns', remainingReturns);

    return { success: true, syncedCount: syncCount };
  } catch (err) {
    console.error('Error syncing offline data:', err.message);
    return { success: false, error: err.message };
  }
};

// Helper to check if any unsynced local data is pending
export const getUnsyncedCount = () => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);
  const unsyncedProductsCount = products.filter(p => p.synced === false).length;

  const expenses = getLocalData('uk_expenses', []);
  const unsyncedExpensesCount = expenses.filter(e => e.synced === false).length;

  const parties = getLocalData('uk_parties', []);
  const unsyncedPartiesCount = parties.filter(p => p.synced === false).length;

  const partyTxs = getLocalData('uk_party_transactions', []);
  const unsyncedPartyTxsCount = partyTxs.filter(t => t.synced === false).length;

  const unsyncedUpdatesCount = getLocalData('unsynced_product_updates', []).length;
  const unsyncedCheckoutsCount = getLocalData('unsynced_checkouts', []).length;
  const unsyncedExpenseUpdatesCount = getLocalData('unsynced_expense_updates', []).length;
  const unsyncedPartyUpdatesCount = getLocalData('unsynced_party_updates', []).length;
  const unsyncedPartyTxUpdatesCount = getLocalData('unsynced_party_transaction_updates', []).length;

  const unsyncedDeletedPartiesCount = getLocalData('deleted_party_ids', []).length;
  const unsyncedDeletedTxsCount = getLocalData('deleted_party_transaction_ids', []).length;
  const unsyncedDeletedExpensesCount = getLocalData('deleted_expense_ids', []).length;
  const unsyncedReturnsCount = getLocalData('unsynced_returns', []).length;

  return unsyncedProductsCount + unsyncedExpensesCount + unsyncedPartiesCount + unsyncedPartyTxsCount +
         unsyncedUpdatesCount + unsyncedCheckoutsCount + unsyncedExpenseUpdatesCount +
         unsyncedPartyUpdatesCount + unsyncedPartyTxUpdatesCount +
         unsyncedDeletedPartiesCount + unsyncedDeletedTxsCount + unsyncedDeletedExpensesCount +
         unsyncedReturnsCount;
};

/**
 * ----------------------------------------------------
 * PARTIES OPERATIONS
 * ----------------------------------------------------
 */

// Fetch all parties
export const getParties = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('uk_parties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const dbParties = (data || []).map(p => ({
        id: p.id.toString(),
        name: p.name || '',
        phone: p.phone || '',
        address: p.address || '',
        created_at: p.created_at || ''
      }));

      const localParties = getLocalData('uk_parties', []);
      const unsyncedAdditions = localParties.filter(p => p.synced === false);
      const unsyncedUpdates = getLocalData('unsynced_party_updates', []);

      let merged = [...dbParties];

      // Apply updates
      merged = merged.map(p => {
        const update = unsyncedUpdates.find(u => u.partyId.toString() === p.id.toString());
        if (update) {
          return { ...p, ...update.formattedParty };
        }
        return p;
      });

      // Filter out deleted
      const deletedIds = new Set(getLocalData('deleted_party_ids', []));
      merged = merged.filter(p => !deletedIds.has(p.id.toString()));

      // Add additions
      const dbIds = new Set(dbParties.map(p => p.id.toString()));
      unsyncedAdditions.forEach(p => {
        if (!dbIds.has(p.id.toString())) {
          merged.unshift(p);
        }
      });

      return merged;
    } catch (error) {
      console.warn('Error fetching parties from Supabase, falling back locally:', error.message);
      return getLocalPartiesFallback();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalPartiesFallback();
  }
};

const getLocalPartiesFallback = () => {
  return getLocalData('uk_parties', []);
};

// Add a party
export const addParty = async (partyData) => {
  const numericId = generateNumericId();
  const formattedParty = {
    id: numericId,
    name: partyData.name,
    phone: partyData.phone || '',
    address: partyData.address || '',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_parties')
        .insert([formattedParty]);

      if (error) throw error;

      // sync local
      const localParties = getLocalData('uk_parties', []);
      localParties.unshift(formattedParty);
      saveLocalData('uk_parties', localParties);

      return { success: true };
    } catch (error) {
      console.warn('Error adding party to Supabase, falling back locally:', error.message);
      return executeLocalAddParty(formattedParty);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalAddParty(formattedParty);
  }
};

const executeLocalAddParty = (formattedParty) => {
  const localParties = getLocalData('uk_parties', []);
  localParties.unshift({ ...formattedParty, synced: false });
  saveLocalData('uk_parties', localParties);
  return { success: true, local: true };
};

// Update a party
export const updateParty = async (partyId, partyData) => {
  const formattedParty = {
    name: partyData.name,
    phone: partyData.phone || '',
    address: partyData.address || ''
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_parties')
        .update(formattedParty)
        .eq('id', parseInt(partyId, 10));

      if (error) throw error;

      executeLocalUpdateParty(partyId, formattedParty);
      return { success: true };
    } catch (error) {
      console.warn('Error updating party in Supabase, falling back locally:', error.message);
      return executeLocalUpdateParty(partyId, formattedParty);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalUpdateParty(partyId, formattedParty);
  }
};

const queueLocalPartyUpdate = (partyId, formattedParty) => {
  const idStr = partyId.toString();
  if (/^\d+$/.test(idStr)) {
    const updates = getLocalData('unsynced_party_updates', []);
    const filtered = updates.filter(u => u.partyId.toString() !== idStr);
    filtered.push({ partyId, formattedParty });
    saveLocalData('unsynced_party_updates', filtered);
  } else {
    const localParties = getLocalData('uk_parties', []);
    const idx = localParties.findIndex(p => p.id.toString() === idStr);
    if (idx !== -1) {
      localParties[idx].synced = false;
      saveLocalData('uk_parties', localParties);
    }
  }
};

const executeLocalUpdateParty = (partyId, formattedParty) => {
  const localParties = getLocalData('uk_parties', []);
  const index = localParties.findIndex(p => p.id.toString() === partyId.toString());
  if (index !== -1) {
    localParties[index] = {
      ...localParties[index],
      ...formattedParty
    };
    saveLocalData('uk_parties', localParties);
  }

  queueLocalPartyUpdate(partyId, formattedParty);
  return { success: true, local: true };
};

// Delete a party
export const deleteParty = async (partyId) => {
  if (isSupabaseConfigured()) {
    try {
      // First, delete the transactions associated with the party to avoid foreign key violations!
      const { error: txError } = await supabase
        .from('uk_party_transactions')
        .delete()
        .eq('party_id', parseInt(partyId, 10));

      if (txError) throw txError;

      const { error } = await supabase
        .from('uk_parties')
        .delete()
        .eq('id', parseInt(partyId, 10));

      if (error) throw error;

      executeLocalDeleteParty(partyId, false); // NOT offline/local only
      return { success: true };
    } catch (error) {
      console.warn('Error deleting party from Supabase, falling back locally:', error.message);
      return executeLocalDeleteParty(partyId, true); // IS offline/local fallback
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalDeleteParty(partyId, true);
  }
};

const executeLocalDeleteParty = (partyId, isOffline = false) => {
  const localParties = getLocalData('uk_parties', []);
  const filteredParties = localParties.filter(p => (p.id || '').toString() !== (partyId || '').toString());
  saveLocalData('uk_parties', filteredParties);

  const localTxs = getLocalData('uk_party_transactions', []);
  const partyTxs = localTxs.filter(t => (t.party_id || '').toString() === (partyId || '').toString());
  const filteredTxs = localTxs.filter(t => (t.party_id || '').toString() !== (partyId || '').toString());
  saveLocalData('uk_party_transactions', filteredTxs);

  if (isOffline) {
    // Queue party deletion
    const deletedPartyIds = getLocalData('deleted_party_ids', []);
    if (!deletedPartyIds.includes(partyId.toString())) {
      deletedPartyIds.push(partyId.toString());
      saveLocalData('deleted_party_ids', deletedPartyIds);
    }

    // Queue transaction deletions for this party's transactions so they are also synced if offline
    const deletedTxIds = getLocalData('deleted_party_transaction_ids', []);
    let changedTxs = false;
    partyTxs.forEach(tx => {
      const txIdStr = tx.id.toString();
      if (!deletedTxIds.includes(txIdStr)) {
        deletedTxIds.push(txIdStr);
        changedTxs = true;
      }
    });
    if (changedTxs) {
      saveLocalData('deleted_party_transaction_ids', deletedTxIds);
    }
  }

  return { success: true, local: true };
};

/**
 * ----------------------------------------------------
 * PARTY TRANSACTIONS OPERATIONS
 * ----------------------------------------------------
 */

// Fetch transactions for a specific party
export const getPartyTransactions = async (partyId) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('uk_party_transactions')
        .select('*')
        .eq('party_id', parseInt(partyId, 10))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const dbTxs = (data || []).map(t => ({
        id: t.id.toString(),
        party_id: t.party_id.toString(),
        amount: parseFloat(t.amount || 0),
        type: t.type || 'Due',
        description: t.description || '',
        created_at: t.created_at || ''
      }));

      const localTxs = getLocalData('uk_party_transactions', []);
      const unsyncedAdditions = localTxs.filter(t => t.synced === false && t.party_id.toString() === partyId.toString());
      const unsyncedUpdates = getLocalData('unsynced_party_transaction_updates', []);

      let merged = [...dbTxs];

      // Apply updates
      merged = merged.map(t => {
        const update = unsyncedUpdates.find(u => u.txId.toString() === t.id.toString());
        if (update) {
          return { ...t, ...update.formattedTx };
        }
        return t;
      });

      // Filter out deleted
      const deletedIds = new Set(getLocalData('deleted_party_transaction_ids', []));
      merged = merged.filter(t => !deletedIds.has(t.id.toString()));

      // Add additions
      const dbIds = new Set(dbTxs.map(t => t.id.toString()));
      unsyncedAdditions.forEach(t => {
        if (!dbIds.has(t.id.toString())) {
          merged.unshift(t);
        }
      });

      return merged;
    } catch (error) {
      console.warn('Error fetching party transactions from Supabase, falling back locally:', error.message);
      return getLocalPartyTransactionsFallback(partyId);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalPartyTransactionsFallback(partyId);
  }
};

const getLocalPartyTransactionsFallback = (partyId) => {
  const txs = getLocalData('uk_party_transactions', []);
  return txs.filter(t => t.party_id.toString() === partyId.toString());
};

// Add a party transaction
export const addPartyTransaction = async (txData) => {
  const numericId = generateNumericId();
  const formattedTx = {
    id: numericId,
    party_id: parseInt(txData.party_id, 10),
    amount: parseFloat(parseFloat(txData.amount || 0).toFixed(2)),
    type: txData.type || 'Due',
    description: txData.description || '',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_party_transactions')
        .insert([formattedTx]);

      if (error) throw error;

      // sync local
      const localTxs = getLocalData('uk_party_transactions', []);
      localTxs.unshift(formattedTx);
      saveLocalData('uk_party_transactions', localTxs);

      return { success: true };
    } catch (error) {
      console.warn('Error adding party transaction to Supabase, falling back locally:', error.message);
      return executeLocalAddPartyTx(formattedTx);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalAddPartyTx(formattedTx);
  }
};

const executeLocalAddPartyTx = (formattedTx) => {
  const localTxs = getLocalData('uk_party_transactions', []);
  localTxs.unshift({ ...formattedTx, synced: false });
  saveLocalData('uk_party_transactions', localTxs);
  return { success: true, local: true };
};

// Update a party transaction
export const updatePartyTransaction = async (txId, txData) => {
  const formattedTx = {
    amount: parseFloat(parseFloat(txData.amount || 0).toFixed(2)),
    type: txData.type || 'Due',
    description: txData.description || ''
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_party_transactions')
        .update(formattedTx)
        .eq('id', parseInt(txId, 10));

      if (error) throw error;

      executeLocalUpdatePartyTx(txId, formattedTx);
      return { success: true };
    } catch (error) {
      console.warn('Error updating party transaction in Supabase, falling back locally:', error.message);
      return executeLocalUpdatePartyTx(txId, formattedTx);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalUpdatePartyTx(txId, formattedTx);
  }
};

const queueLocalPartyTxUpdate = (txId, formattedTx) => {
  const idStr = txId.toString();
  if (/^\d+$/.test(idStr)) {
    const updates = getLocalData('unsynced_party_transaction_updates', []);
    const filtered = updates.filter(u => u.txId.toString() !== idStr);
    filtered.push({ txId, formattedTx });
    saveLocalData('unsynced_party_transaction_updates', filtered);
  } else {
    const localTxs = getLocalData('uk_party_transactions', []);
    const idx = localTxs.findIndex(t => t.id.toString() === idStr);
    if (idx !== -1) {
      localTxs[idx].synced = false;
      saveLocalData('uk_party_transactions', localTxs);
    }
  }
};

const executeLocalUpdatePartyTx = (txId, formattedTx) => {
  const localTxs = getLocalData('uk_party_transactions', []);
  const index = localTxs.findIndex(t => t.id.toString() === txId.toString());
  if (index !== -1) {
    localTxs[index] = {
      ...localTxs[index],
      ...formattedTx
    };
    saveLocalData('uk_party_transactions', localTxs);
  }

  queueLocalPartyTxUpdate(txId, formattedTx);
  return { success: true, local: true };
};

// Delete a party transaction
export const deletePartyTransaction = async (txId) => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('uk_party_transactions')
        .delete()
        .eq('id', parseInt(txId, 10));

      if (error) throw error;

      executeLocalDeletePartyTx(txId, false); // NOT offline/local only
      return { success: true };
    } catch (error) {
      console.warn('Error deleting party transaction from Supabase, falling back locally:', error.message);
      return executeLocalDeletePartyTx(txId, true); // IS offline/local fallback
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalDeletePartyTx(txId, true);
  }
};

const executeLocalDeletePartyTx = (txId, isOffline = false) => {
  const localTxs = getLocalData('uk_party_transactions', []);
  const filtered = localTxs.filter(t => (t.id || '').toString() !== (txId || '').toString());
  saveLocalData('uk_party_transactions', filtered);

  if (isOffline) {
    const deletedTxs = getLocalData('deleted_party_transaction_ids', []);
    if (!deletedTxs.includes(txId.toString())) {
      deletedTxs.push(txId.toString());
      saveLocalData('deleted_party_transaction_ids', deletedTxs);
    }
  }

  return { success: true, local: true };
};

/**
 * ----------------------------------------------------
 * PRODUCT RETURNS OPERATIONS
 * ----------------------------------------------------
 */

// Fetch all returns
export const getReturns = async () => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('product_returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id.toString(),
        return_id: r.return_id,
        sale_item_id: r.sale_item_id.toString(),
        returned_quantity: parseInt(r.returned_quantity || 0, 10),
        refund_amount: parseFloat(r.refund_amount || 0),
        restock_status: r.restock_status || 'Restocked',
        created_at: r.created_at || ''
      }));
    } catch (error) {
      console.warn('Error fetching returns from Supabase, falling back to local storage:', error.message);
      return getLocalReturnsFallback();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalReturnsFallback();
  }
};

const getLocalReturnsFallback = () => {
  return getLocalData('uk_product_returns', []).map(r => ({
    ...r,
    returned_quantity: parseInt(r.returned_quantity || 0, 10),
    refund_amount: parseFloat(r.refund_amount || 0)
  }));
};

// Execute a product return
export const executeReturn = async (saleItemId, returnedQty, refundAmount, restockStatus) => {
  const returnId = `ret_${Date.now()}`;
  const dateStr = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      await executeSupabaseReturn(saleItemId, returnedQty, refundAmount, restockStatus, returnId, dateStr);
      
      // Also update local cache so dashboard works offline
      const localReturns = getLocalData('uk_product_returns', []);
      localReturns.unshift({
        id: `ret_${Date.now()}`,
        return_id: returnId,
        sale_item_id: saleItemId.toString(),
        returned_quantity: parseInt(returnedQty, 10),
        refund_amount: parseFloat(refundAmount),
        restock_status: restockStatus,
        created_at: dateStr,
        synced: true
      });
      saveLocalData('uk_product_returns', localReturns);

      return { success: true };
    } catch (error) {
      console.warn('Error executing return in Supabase, falling back locally:', error.message);
      return executeLocalReturn(saleItemId, returnedQty, refundAmount, restockStatus, returnId, dateStr);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalReturn(saleItemId, returnedQty, refundAmount, restockStatus, returnId, dateStr);
  }
};

const executeSupabaseReturn = async (saleItemId, returnedQty, refundAmount, restockStatus, returnId, dateStr) => {
  // Try atomic RPC
  const { error: rpcErr } = await supabase.rpc('execute_return', {
    p_return_id: returnId,
    p_sale_item_id: parseInt(saleItemId, 10),
    p_returned_quantity: parseInt(returnedQty, 10),
    p_refund_amount: parseFloat(refundAmount),
    p_restock_status: restockStatus
  });

  if (!rpcErr) {
    return { success: true };
  }

  // Fallback check
  const fnNotExist = rpcErr.message && (
    rpcErr.message.includes('does not exist') ||
    rpcErr.message.includes('not found') ||
    rpcErr.code === '42883'
  );

  if (fnNotExist) {
    console.warn('RPC execute_return not found on database. Falling back to client execution.');
    
    // Fetch original sale item details to find product ID
    const { data: saleItem, error: fetchErr } = await supabase
      .from('customer_sales')
      .select('*')
      .eq('id', parseInt(saleItemId, 10))
      .single();

    if (fetchErr) throw fetchErr;

    // Insert return record
    const { error: insErr } = await supabase
      .from('product_returns')
      .insert([{
        return_id: returnId,
        sale_item_id: parseInt(saleItemId, 10),
        returned_quantity: parseInt(returnedQty, 10),
        refund_amount: parseFloat(refundAmount),
        restock_status: restockStatus,
        created_at: dateStr
      }]);

    if (insErr) throw insErr;

    // Update stock if restocked
    if (restockStatus === 'Restocked' && saleItem.product_id) {
      const { data: product, error: prodFetchErr } = await supabase
        .from('uk_products')
        .select('stock')
        .eq('id', saleItem.product_id)
        .single();

      if (!prodFetchErr && product) {
        const newStock = parseInt(product.stock || 0, 10) + parseInt(returnedQty, 10);
        await supabase
          .from('uk_products')
          .update({ stock: newStock })
          .eq('id', saleItem.product_id);
      }
    }

    return { success: true };
  } else {
    throw rpcErr;
  }
};

const executeLocalReturn = (saleItemId, returnedQty, refundAmount, restockStatus, returnId, dateStr) => {
  const localReturns = getLocalData('uk_product_returns', []);
  const newReturn = {
    id: `ret_${Date.now()}`,
    return_id: returnId,
    sale_item_id: saleItemId.toString(),
    returned_quantity: parseInt(returnedQty, 10),
    refund_amount: parseFloat(refundAmount),
    restock_status: restockStatus,
    created_at: dateStr,
    synced: false
  };
  localReturns.unshift(newReturn);
  saveLocalData('uk_product_returns', localReturns);

  // If restocking, increase local product stock
  if (restockStatus === 'Restocked') {
    const products = getLocalData('uk_products', DUMMY_PRODUCTS);
    const sales = getLocalData('uk_sales', DUMMY_SALES);
    const saleItem = sales.find(s => s.sale_id === saleItemId || s.id === saleItemId);
    if (saleItem) {
      const product = products.find(p => p.name.trim().toLowerCase() === saleItem.product_name.trim().toLowerCase());
      if (product) {
        product.stock = (parseInt(product.stock || 0, 10) + parseInt(returnedQty, 10)).toString();
        saveLocalData('uk_products', products);
      }
    }
  }

  // Queue return for offline sync
  const unsyncedReturns = getLocalData('unsynced_returns', []);
  unsyncedReturns.push({
    saleItemId,
    returnedQty,
    refundAmount,
    restockStatus,
    returnId,
    date: dateStr
  });
  saveLocalData('unsynced_returns', unsyncedReturns);

  return { success: true, local: true };
};
