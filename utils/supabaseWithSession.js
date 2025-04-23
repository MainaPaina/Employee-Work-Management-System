const { createClient } = require('@supabase/supabase-js');

module.exports = function getSupabase(req) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    }
  });
};
