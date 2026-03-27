-- Admin seed — your super admin account
-- Phone: 7897671348
-- Run AFTER schema.sql

INSERT INTO admins (phone, name, role, is_active, permissions)
VALUES (
  '7897671348',
  'Super Admin',
  'super_admin',
  TRUE,
  '{
    "view_users": true,
    "view_projects": true,
    "view_analytics": true,
    "view_revenue": true,
    "view_activity": true,
    "manage_users": true,
    "manage_admins": true,
    "suspend_users": true,
    "delete_projects": true
  }'
) ON CONFLICT (phone) DO NOTHING;
