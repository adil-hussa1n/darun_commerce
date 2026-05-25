import axios from 'axios';

// Retreive the API URLs from environment variables.
const API_URL = import.meta.env.VITE_SHEETDB_API_URL || '';
const PRODUCTS_URL_ENV = import.meta.env.VITE_SHEETDB_PRODUCTS_URL || '';
const SALES_URL_ENV = import.meta.env.VITE_SHEETDB_SALES_URL || '';

// Clean up trailing slash if any
const BASE_URL = API_URL.replace(/\/$/, '');
const PRODUCTS_URL = PRODUCTS_URL_ENV.replace(/\/$/, '') || (BASE_URL ? `${BASE_URL}?sheet=products` : '');
const SALES_URL = SALES_URL_ENV.replace(/\/$/, '') || (BASE_URL ? `${BASE_URL}?sheet=sales` : '');

// Utility helper to check if SheetDB integration is active
export const isApiConfigured = () => {
  return (typeof PRODUCTS_URL === 'string' && PRODUCTS_URL.trim() !== '') &&
         (typeof SALES_URL === 'string' && SALES_URL.trim() !== '');
};

/**
 * ----------------------------------------------------
 * DYNAMIC HEADER DETECTION HELPER FUNCTIONS
 * ----------------------------------------------------
 * These functions parse existing rows from SheetDB to find if the user
 * made spacing or spelling typos in Row 1 of their Google Spreadsheet,
 * mapping them dynamically so the code doesn't crash.
 */

const detectProductHeaders = (sampleProduct) => {
  const headers = {
    id: 'id',
    name: 'name',
    category: 'category',
    buy_price: 'buy_price',
    sell_price: 'sell_price',
    stock: 'stock',
    image: 'image',
    notes: 'notes',
    created_at: 'created_at'
  };
  
  if (!sampleProduct) return headers;
  
  Object.keys(sampleProduct).forEach(key => {
    const trimmed = key.trim();
    if (trimmed === 'id') headers.id = key;
    else if (trimmed === 'name') headers.name = key;
    else if (trimmed === 'category') headers.category = key;
    else if (trimmed === 'buy_price') headers.buy_price = key;
    else if (trimmed === 'sell_price') headers.sell_price = key;
    else if (trimmed === 'stock') headers.stock = key;
    else if (trimmed === 'image') headers.image = key;
    else if (trimmed === 'notes') headers.notes = key;
    else if (trimmed === 'created_at' || trimmed === 'createed_at') headers.created_at = key;
  });
  
  return headers;
};

const detectSalesHeaders = (sampleSale) => {
  const headers = {
    sale_id: 'sale_id',
    product_name: 'product_name',
    category: 'category',
    quantity: 'quantity',
    unit_price: 'unit_price',
    total_price: 'total_price',
    date: 'date'
  };

  if (!sampleSale) return headers;

  Object.keys(sampleSale).forEach(key => {
    const trimmed = key.trim();
    if (trimmed === 'sale_id') headers.sale_id = key;
    else if (trimmed === 'product_name') headers.product_name = key;
    else if (trimmed === 'category') headers.category = key;
    else if (trimmed === 'quantity' || trimmed === 'quality') headers.quantity = key;
    else if (trimmed === 'unit_price') headers.unit_price = key;
    else if (trimmed === 'total_price') headers.total_price = key;
    else if (trimmed === 'date') headers.date = key;
  });

  return headers;
};

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

/**
 * ----------------------------------------------------
 * PRODUCTS OPERATIONS
 * ----------------------------------------------------
 */

// Fetch all products
export const getProducts = async () => {
  if (isApiConfigured()) {
    try {
      const response = await axios.get(PRODUCTS_URL);
      if (!response.data || response.data.length === 0) return [];
      
      // Auto detect any user sheet header spaces or typos
      const headers = detectProductHeaders(response.data[0]);

      return response.data.map(p => ({
        id: (p[headers.id] || '').toString(),
        name: (p[headers.name] || '').toString(),
        category: (p[headers.category] || '').toString(),
        buy_price: parseFloat(p[headers.buy_price] || 0),
        sell_price: parseFloat(p[headers.sell_price] || 0),
        stock: parseInt(p[headers.stock] || 0, 10),
        image: (p[headers.image] || '').toString(),
        notes: (p[headers.notes] || '').toString(),
        created_at: (p[headers.created_at] || '').toString(),
      }));
    } catch (error) {
      console.error('Error fetching products from SheetDB, failing over to mock:', error);
      throw error;
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 800));
    const products = getLocalData('uk_products', DUMMY_PRODUCTS);
    return products.map(p => ({
      ...p,
      buy_price: parseFloat(p.buy_price || 0),
      sell_price: parseFloat(p.sell_price || 0),
      stock: parseInt(p.stock || 0, 10),
    }));
  }
};

// Add a single product
export const addProduct = async (productData) => {
  let headers = {
    id: 'id',
    name: 'name',
    category: 'category',
    buy_price: 'buy_price',
    sell_price: 'sell_price',
    stock: 'stock',
    image: 'image',
    notes: 'notes',
    created_at: 'created_at'
  };

  // If connected, fetch headers to make sure we map correctly
  if (isApiConfigured()) {
    try {
      const getRes = await axios.get(PRODUCTS_URL);
      if (getRes.data && getRes.data.length > 0) {
        headers = detectProductHeaders(getRes.data[0]);
      }
    } catch (err) {
      console.warn('Skipped header auto-detection on add:', err.message);
    }
  }

  // Fallback demo product icon URL if user leaves it empty
  const defaultImage = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400';
  const imgUrl = (productData.image && productData.image.trim() !== '') 
    ? productData.image.trim() 
    : defaultImage;

  const formattedProduct = {};
  formattedProduct[headers.id] = `prod_${Date.now()}`;
  formattedProduct[headers.name] = productData.name;
  formattedProduct[headers.category] = productData.category;
  formattedProduct[headers.buy_price] = parseFloat(productData.buy_price || 0).toFixed(2);
  formattedProduct[headers.sell_price] = parseFloat(productData.sell_price || 0).toFixed(2);
  formattedProduct[headers.stock] = parseInt(productData.stock || 0, 10).toString();
  formattedProduct[headers.image] = imgUrl;
  formattedProduct[headers.notes] = productData.notes || '';
  formattedProduct[headers.created_at] = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (isApiConfigured()) {
    try {
      const response = await axios.post(PRODUCTS_URL, {
        data: [formattedProduct]
      });
      return response.data;
    } catch (error) {
      console.error('Error adding product to SheetDB:', error);
      throw error;
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 800));
    const products = getLocalData('uk_products', DUMMY_PRODUCTS);
    
    // Format locally for standard structure
    const localProduct = {
      id: formattedProduct[headers.id],
      name: formattedProduct[headers.name],
      category: formattedProduct[headers.category],
      buy_price: formattedProduct[headers.buy_price],
      sell_price: formattedProduct[headers.sell_price],
      stock: formattedProduct[headers.stock],
      image: formattedProduct[headers.image],
      notes: formattedProduct[headers.notes],
      created_at: formattedProduct[headers.created_at]
    };

    products.unshift(localProduct);
    saveLocalData('uk_products', products);
    return { created: 1 };
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
export const sellMultipleProducts = async (cartItems) => {
  if (cartItems.length === 0) {
    throw new Error('No items in checkout list');
  }

  if (isApiConfigured()) {
    try {
      // 1. Fetch current raw products to check stock and find column headers
      const responseGet = await axios.get(PRODUCTS_URL);
      const rawProducts = responseGet.data;
      if (!rawProducts || rawProducts.length === 0) {
        throw new Error('No products found in the sheet database.');
      }
      
      const prodHeaders = detectProductHeaders(rawProducts[0]);
      
      // Perform validation and prepare updates
      const stockUpdates = [];
      for (const item of cartItems) {
        const product = rawProducts.find(p => (p[prodHeaders.id] || '').toString() === item.id.toString());
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }

        const currentStock = parseInt(product[prodHeaders.stock] || 0, 10);
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for "${product[prodHeaders.name]}". Only ${currentStock} left.`);
        }

        stockUpdates.push({
          productId: item.id,
          newStock: currentStock - item.quantity,
          name: product[prodHeaders.name],
          category: product[prodHeaders.category] || '',
          unitPrice: parseFloat(product[prodHeaders.sell_price] || 0)
        });
      }

      // 2. Perform Stock Reduction PATCH calls in parallel
      await Promise.all(
        stockUpdates.map(async (update) => {
          const patchData = {};
          patchData[prodHeaders.stock] = update.newStock.toString();
          const patchUrl = `${PRODUCTS_URL}/${prodHeaders.id}/${update.productId}`;
          await axios.patch(patchUrl, { data: patchData });
        })
      );

      // 3. Save all transaction entries to the Sales Sheet
      // Fetch sales logs to match user columns
      let salesHeaders = {
        sale_id: 'sale_id',
        product_name: 'product_name',
        category: 'category',
        quantity: 'quantity',
        unit_price: 'unit_price',
        total_price: 'total_price',
        date: 'date'
      };

      try {
        const salesGet = await axios.get(SALES_URL);
        if (salesGet.data && salesGet.data.length > 0) {
          salesHeaders = detectSalesHeaders(salesGet.data[0]);
        }
      } catch (err) {
        console.warn('Skipped sales header auto-detection:', err.message);
      }

      const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const batchTimestamp = Date.now();
      const salesRows = stockUpdates.map((update, index) => {
        const newSale = {};
        // Make sale_ids unique even in batch checkout
        newSale[salesHeaders.sale_id] = `sale_${batchTimestamp}_${index}`;
        newSale[salesHeaders.product_name] = update.name;
        newSale[salesHeaders.category] = update.category;
        const targetQty = cartItems.find(item => item.id.toString() === update.productId.toString()).quantity;
        newSale[salesHeaders.quantity] = targetQty.toString();
        newSale[salesHeaders.unit_price] = update.unitPrice.toFixed(2);
        newSale[salesHeaders.total_price] = (update.unitPrice * targetQty).toFixed(2);
        newSale[salesHeaders.date] = dateStr;
        return newSale;
      });

      await axios.post(SALES_URL, {
        data: salesRows
      });

      return { success: true };
    } catch (error) {
      console.error('Error executing batch sales in SheetDB:', error);
      throw error;
    }
  } else {
    // Local fallback mode
    await new Promise(resolve => setTimeout(resolve, 800));
    const products = getLocalData('uk_products', DUMMY_PRODUCTS);
    
    // Verify stock
    for (const item of cartItems) {
      const product = products.find(p => p.id.toString() === item.id.toString());
      if (!product) throw new Error(`Product not found`);
      const currentStock = parseInt(product.stock, 10);
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Only ${currentStock} left.`);
      }
    }

    // Cut stock
    for (const item of cartItems) {
      const product = products.find(p => p.id.toString() === item.id.toString());
      product.stock = (parseInt(product.stock, 10) - item.quantity).toString();
    }
    saveLocalData('uk_products', products);

    // Save logs
    const sales = getLocalData('uk_sales', DUMMY_SALES);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const batchTimestamp = Date.now();

    cartItems.forEach((item, index) => {
      const product = DUMMY_PRODUCTS.find(p => p.id.toString() === item.id.toString()) || item;
      const newSale = {
        sale_id: `sale_${batchTimestamp}_${index}`,
        product_name: item.name || product.name,
        category: item.category || product.category,
        quantity: item.quantity.toString(),
        unit_price: parseFloat(item.sell_price).toFixed(2),
        total_price: (parseFloat(item.sell_price) * item.quantity).toFixed(2),
        date: dateStr
      };
      sales.unshift(newSale);
    });
    saveLocalData('uk_sales', sales);

    return { success: true };
  }
};

// Fetch sales transaction history
export const getSalesHistory = async () => {
  if (isApiConfigured()) {
    try {
      const response = await axios.get(SALES_URL);
      if (!response.data || response.data.length === 0) return [];
      
      const headers = detectSalesHeaders(response.data[0]);

      return response.data.map(s => ({
        sale_id: (s[headers.sale_id] || '').toString(),
        product_name: (s[headers.product_name] || '').toString(),
        category: (s[headers.category] || '').toString(),
        quantity: parseInt(s[headers.quantity] || 0, 10),
        unit_price: parseFloat(s[headers.unit_price] || 0),
        total_price: parseFloat(s[headers.total_price] || 0),
        date: (s[headers.date] || '').toString(),
      }));
    } catch (error) {
      console.error('Error fetching sales history from SheetDB, failing over to mock:', error);
      throw error;
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 500));
    const sales = getLocalData('uk_sales', DUMMY_SALES);
    return sales.map(s => ({
      ...s,
      quantity: parseInt(s.quantity || 0, 10),
      unit_price: parseFloat(s.unit_price || 0),
      total_price: parseFloat(s.total_price || 0)
    }));
  }
};
