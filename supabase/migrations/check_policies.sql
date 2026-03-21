-- Script to check current policies
SELECT * FROM pg_policies WHERE tablename = 'sales';
