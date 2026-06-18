import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const formattedProduct = {
    id: 'test_prod_' + Date.now(),
    serial_no: 'SN-TEST',
    category: 'Test Category',
    brand: 'Test Brand',
    name: 'Test Product ' + Date.now(),
    model_barcode: 'BAR-TEST',
    ml_mg: '100ml',
    buy_price: 10,
    sell_price: 20,
    stock: 5,
    image: '/logo.png',
    created_at: new Date().toISOString()
  };

  console.log('Inserting product:', formattedProduct);
  const { data, error } = await supabase
    .from('uk_products')
    .insert([formattedProduct]);

  if (error) {
    console.error('Insert error details:', error);
  } else {
    console.log('Insert succeeded! Response:', data);
  }
}

run();
