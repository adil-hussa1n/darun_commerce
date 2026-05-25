import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olitcbvfmnuycjijdfbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saXRjYnZmbW51eWNqaWpkZmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjEzMDAsImV4cCI6MjA5NTI5NzMwMH0.KA6nI5JCVXkK0FNHmE8gpeQMgokkhkvUAVAnfPwr_1c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- ALL PRODUCTS IN uk_products ---');
  try {
    const { data, error } = await supabase.from('uk_products').select('*');
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

run();
