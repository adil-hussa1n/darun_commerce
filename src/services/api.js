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
    name: 'Rosewater Hydrating Mist',
    category: 'Skin Care',
    buy_price: '8.00',
    sell_price: '180.00',
    stock: '12',
    image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400',
    notes: 'Refreshing facial mist infused with pure rosewater and hyaluronic acid to instantly hydrate and soothe.',
    created_at: '2026-05-20 10:00:00'
  },
  {
    id: 'prod_2',
    name: 'Glow Vitamin C Serum',
    category: 'Skin Care',
    buy_price: '12.00',
    sell_price: '280.00',
    stock: '3',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400',
    notes: 'Radiance-boosting serum containing 15% Vitamin C, Vitamin E, and Ferulic Acid to brighten dark spots.',
    created_at: '2026-05-21 11:30:00'
  },
  {
    id: 'prod_3',
    name: 'Argan Oil Hair Mask',
    category: 'Hair Care',
    buy_price: '9.50',
    sell_price: '220.00',
    stock: '8',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400',
    notes: 'Deep conditioning hair mask with pure Moroccan Argan Oil to restore moisture, shine, and elasticity.',
    created_at: '2026-05-22 09:15:00'
  },
  {
    id: 'prod_4',
    name: 'Coconut & Shea Body Butter',
    category: 'Body Care',
    buy_price: '6.00',
    sell_price: '150.00',
    stock: '4',
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&q=80&w=400',
    notes: 'Ultra-rich body butter whipped with organic coconut oil and shea butter for 24-hour intense nourishment.',
    created_at: '2026-05-23 14:20:00'
  },
  {
    id: 'prod_5',
    name: 'Gentle Oatmeal Cleanser',
    category: 'Skin Care',
    buy_price: '5.50',
    sell_price: '140.00',
    stock: '15',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400',
    notes: 'Calming, non-foaming daily cleanser formulated with colloidal oatmeal to cleanse sensitive skin without stripping.',
    created_at: '2026-05-24 08:45:00'
  },
  {
    id: 'prod_6',
    name: 'Tea Tree Purifying Shampoo',
    category: 'Hair Care',
    buy_price: '7.00',
    sell_price: '165.50',
    stock: '2',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=400',
    notes: 'Clarifying shampoo infused with tea tree oil and peppermint to invigorate the scalp and reduce flakiness.',
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

// Helper to perform product addition locally
const executeLocalAddProductDirect = (formattedProduct) => {
  const products = getLocalData('uk_products', DUMMY_PRODUCTS);
  products.unshift(formattedProduct);
  saveLocalData('uk_products', products);
  return { created: 1, local: true };
};

// Helper to compute difference between old and new product fields
const getProductDiff = (oldProd, newProd) => {
  const changes = {};
  const fields = ['name', 'category', 'buy_price', 'sell_price', 'stock', 'notes', 'image'];
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
          buy_price: parseFloat(p.buy_price || 0),
          sell_price: parseFloat(p.sell_price || 0),
          stock: parseInt(p.stock || 0, 10),
          image: p.image || '',
          notes: p.notes || '',
          created_at: p.created_at || '',
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
  const defaultImage = '/logo.png';
  const imgUrl = (productData.image && productData.image.trim() !== '') 
    ? productData.image.trim() 
    : defaultImage;

  const formattedProduct = {
    id: `prod_${Date.now()}`,
    name: productData.name,
    category: productData.category || '',
    buy_price: Math.round(parseFloat(productData.buy_price || 0)),
    sell_price: Math.round(parseFloat(productData.sell_price || 0)),
    stock: parseInt(productData.stock || 0, 10),
    image: imgUrl,
    notes: productData.notes || '',
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
          total_price: Math.round(finalItemTotalPrice),
          discount: Math.round(distributedDiscount),
          payment_method: paymentMethod || 'Cash',
          sale_id: `sale_${batchTimestamp}_${index}`
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

      // 4. Best-effort backup logging into uk_sales
      try {
        const dateStr = new Date().toISOString();
        const salesRows = stockUpdates.map((update, index) => {
          const itemSubtotal = update.unitPrice * update.qtySold;
          const distributedDiscount = totalCartVal > 0 ? (itemSubtotal / totalCartVal) * discount : 0;
          const finalItemTotalPrice = Math.max(0, itemSubtotal - distributedDiscount);

          return {
            sale_id: `sale_${batchTimestamp}_${index}`,
            product_id: (update.dbProductId || update.productId || '').toString(),
            product_name: update.name,
            category: update.category,
            quantity: update.qtySold,
            unit_price: update.unitPrice,
            total_price: finalItemTotalPrice,
            discount: distributedDiscount,
            payment_method: paymentMethod || 'Cash',
            date: dateStr
          };
        });
        const { error: logErr } = await supabase.from('uk_sales').insert(salesRows);
        if (logErr) console.warn('Backup uk_sales logging skipped:', logErr.message);
      } catch (logErr) {
        console.warn('Backup uk_sales logging skipped:', logErr.message);
      }

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
  const defaultImage = '/logo.png';
  const imgUrl = (productData.image && productData.image.trim() !== '') 
    ? productData.image.trim() 
    : defaultImage;

  const formattedProduct = {
    name: productData.name,
    category: productData.category || '',
    buy_price: Math.round(parseFloat(productData.buy_price || 0)),
    sell_price: Math.round(parseFloat(productData.sell_price || 0)),
    stock: parseInt(productData.stock || 0, 10),
    image: imgUrl,
    notes: productData.notes || '',
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
