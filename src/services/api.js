import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from environment variables (supporting both Vite and Node.js environments)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '')) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '')) || '';

// Check if Supabase project is configured in .env
export const isSupabaseConfigured = () => {
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
          ml_mg: update.ml_mg || ''
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

      return (salesRes.data || []).map(s => {
        const productIdStr = (s.product_id || '').toString().trim();
        const product = productMap[productIdStr]
          || productMap[productIdStr.replace(/\D/g, '')];

        const quantity = parseInt(s.quantity || 0, 10);
        const totalPrice = parseFloat(s.total_price || 0);
        const unitPrice = quantity > 0
          ? (product ? parseFloat(product.sell_price || 0) : totalPrice / quantity)
          : 0;

        return {
          sale_id: s.sale_id || `sale_${s.id}`,
          product_name: product ? product.name : (productIdStr || 'Unknown Product'),
          category: product ? (product.category || '') : '',
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          discount: parseFloat(s.discount || 0),
          payment_method: s.payment_method || 'Cash',
          customer_phone: s.customer_phone || '',
          date: s.created_at || '',
        };
      });
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
      return (data || []).map(exp => ({
        id: exp.id.toString(),
        name: exp.name || '',
        amount: parseFloat(exp.amount || 0),
        transaction_type: exp.transaction_type || 'Cash',
        created_at: exp.created_at || ''
      }));
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

      executeLocalDeleteExpense(expenseId);
      return { success: true };
    } catch (error) {
      console.warn('Error deleting expense from Supabase, falling back locally:', error.message);
      return executeLocalDeleteExpense(expenseId);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    return executeLocalDeleteExpense(expenseId);
  }
};

const executeLocalDeleteExpense = (expenseId) => {
  const localExpenses = getLocalData('uk_expenses', []);
  const filtered = localExpenses.filter(exp => exp.id.toString() !== expenseId.toString());
  saveLocalData('uk_expenses', filtered);
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

  const unsyncedUpdatesCount = getLocalData('unsynced_product_updates', []).length;
  const unsyncedCheckoutsCount = getLocalData('unsynced_checkouts', []).length;
  const unsyncedExpenseUpdatesCount = getLocalData('unsynced_expense_updates', []).length;

  return unsyncedProductsCount + unsyncedExpensesCount + unsyncedUpdatesCount + unsyncedCheckoutsCount + unsyncedExpenseUpdatesCount;
};
