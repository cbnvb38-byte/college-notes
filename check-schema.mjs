import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const tables = ['reports', 'review_reports', 'notes', 'bookmarks', 'downloads', 'recently_viewed', 'ratings', 'review_helpful_votes', 'admin_logs'];
  
  for (const table of tables) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      console.log(`Table ${table} first row keys:`, Object.keys(data[0]));
      // check types of note_id if exists
      if ('note_id' in data[0]) {
        console.log(`  -> note_id type:`, typeof data[0].note_id, 'value:', data[0].note_id);
      }
    }
  }
}
check();
