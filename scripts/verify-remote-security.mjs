import { execFileSync } from "node:child_process";

const checks = [
  {
    name: "RLS enabled",
    sql: `
      select relname, relrowsecurity
      from pg_class
      where relnamespace = 'public'::regnamespace
        and relname in (
          'admin_users',
          'categories',
          'products',
          'product_categories',
          'product_images',
          'vendors',
          'vendor_users',
          'product_review_submissions',
          'carts',
          'cart_items',
          'orders',
          'order_items',
          'vendor_orders',
          'vendor_applications'
        )
      order by relname;
    `,
  },
  {
    name: "Policy inventory",
    sql: `
      select schemaname, tablename, policyname, cmd, roles, qual, with_check
      from pg_policies
      where schemaname in ('public', 'storage')
      order by schemaname, tablename, policyname;
    `,
  },
  {
    name: "DELETE policy scope",
    sql: `
      select schemaname, tablename, policyname, cmd, qual
      from pg_policies
      where cmd = 'DELETE'
      order by schemaname, tablename, policyname;
    `,
  },
  {
    name: "RPC existence and security",
    sql: `
      select
        n.nspname as schema,
        p.proname as function_name,
        p.prosecdef as security_definer,
        pg_get_functiondef(p.oid) as definition
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'current_admin_role',
          'is_admin',
          'current_vendor_role',
          'is_active_vendor_member',
          'is_vendor_owner_or_manager',
          'is_canonical_product_field_available',
          'get_vendor_product_category_assignments',
          'approve_product_review_submission',
          'normalize_product_slug',
          'can_view_vendor_submission_image_object',
          'can_manage_vendor_submission_image_object',
          'replace_product_category_assignments',
          'search_active_products',
          'create_cod_order_from_cart',
          'submit_vendor_product_review_submission'
        )
      order by p.proname;
    `,
  },
  {
    name: "Migration history",
    sql: `
      select version
      from supabase_migrations.schema_migrations
      order by version;
    `,
  },
  {
    name: "Extra public tables",
    sql: `
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename not in (
          'admin_users',
          'categories',
          'products',
          'product_categories',
          'product_images',
          'vendors',
          'vendor_users',
          'product_review_submissions',
          'carts',
          'cart_items',
          'orders',
          'order_items',
          'vendor_orders',
          'vendor_applications'
        )
      order by tablename;
    `,
  },
  {
    name: "Phase 2 vendor policy summary",
    sql: `
      select schemaname, tablename, policyname, cmd, roles
      from pg_policies
      where schemaname = 'public'
        and tablename in (
          'vendors',
          'vendor_users',
          'products',
          'product_review_submissions',
          'product_images',
          'product_categories',
          'orders',
          'order_items',
          'vendor_orders',
          'vendor_applications'
        )
      order by tablename, policyname;
    `,
  },
  {
    name: "Commerce table grants",
    sql: `
      select grantee, table_name, privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public'
        and grantee in ('anon', 'authenticated')
        and table_name in (
          'vendors',
          'vendor_users',
          'product_review_submissions',
          'carts',
          'cart_items',
          'orders',
          'order_items',
          'vendor_orders',
          'vendor_applications'
        )
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      order by table_name, grantee, privilege_type;
    `,
  },
  {
    name: "Storage bucket",
    sql: `
      select id, public, file_size_limit, allowed_mime_types
      from storage.buckets
      where id in ('product-images', 'vendor-application-documents')
      order by id;
    `,
  },
];

for (const check of checks) {
  console.log(`\n## ${check.name}`);
  execFileSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-o", "table", check.sql],
    {
      stdio: "inherit",
    },
  );
}
