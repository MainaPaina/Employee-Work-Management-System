# Instructions to Disable RLS for the Timesheets Table

Since we're having issues with the Row Level Security (RLS) policy for the timesheets table, you'll need to disable it using the Supabase dashboard. Here's how:

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project
3. Go to the "Table Editor" in the left sidebar
4. Find the "timesheets" table in the list
5. Click on the "..." menu next to the table name
6. Select "Edit Table"
7. Go to the "RLS Policies" tab
8. Toggle the "Enable RLS" switch to OFF
9. Click "Save" to apply the changes

Alternatively, you can run the following SQL query in the SQL Editor:

```sql
ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;
```

After disabling RLS, try the clock-in and clock-out functionality again. It should work without any RLS policy violations.

If you want to enable RLS again later with a policy that allows all operations, you can run the following SQL queries:

```sql
-- Enable RLS
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
CREATE POLICY allow_all_operations ON timesheets USING (true) WITH CHECK (true);
```

This will enable RLS but with a policy that allows all operations, which is effectively the same as having RLS disabled but with the ability to add more restrictive policies later.
