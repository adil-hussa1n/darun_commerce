import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olitcbvfmnuycjijdfbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saXRjYnZmbW51eWNqaWpkZmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjEzMDAsImV4cCI6MjA5NTI5NzMwMH0.KA6nI5JCVXkK0FNHmE8gpeQMgokkhkvUAVAnfPwr_1c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- CUSTOMER_SALES LAST 5 ---');
  try {
    const { data, error } = await supabase
      .from('customer_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching customer_sales:', error);
    } else {
      console.log('customer_sales:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Exception fetching customer_sales:', e);
  }

  console.log('\n--- UK_SALES LAST 5 ---');
  try {
    const { data, error } = await supabase
      .from('uk_sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching uk_sales:', error);
    } else {
      console.log('uk_sales:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Exception fetching uk_sales:', e);
  }
}

run();
