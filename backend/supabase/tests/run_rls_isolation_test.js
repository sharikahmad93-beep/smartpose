/**
 * ==============================================================================
 * SMART RESTAURANT POS — REGEX & TOKEN-BASED STATIC SQL VALIDATOR
 * Target: Node.js (v18+)
 * Location: backend/supabase/tests/run_rls_isolation_test.js
 * ==============================================================================
 * MANDATORY ARCHITECTURAL DISCLAIMER:
 * This script is a REGEX & TOKEN-BASED STATIC SQL SOURCE-CODE VALIDATOR.
 * It performs lexical pattern matching and regex verification on `rls_isolation_test.sql`.
 *
 * NOTE: This tool does NOT construct a PostgreSQL AST via a parser library.
 * IT DOES NOT CONNECT TO POSTGRESQL OR SUPABASE CLOUD.
 * IT DOES NOT EXECUTE LIVE DATABASE TRANSACTIONS OR SQL QUERIES.
 *
 * Live execution testing occurs manually in Supabase SQL Editor or via CI runners.
 * A static PASS indicates syntactic and pattern compliance, NOT live PostgreSQL verification.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const testSqlPath = path.join(__dirname, 'rls_isolation_test.sql');

/**
 * Statement-scoped detection of unsafe ON CONFLICT DO UPDATE.
 * Scans only within individual SQL statements terminating with a semicolon,
 * ensuring no accidental cross-statement matching with unrelated later statements.
 */
function hasUnsafeDoUpdate(sqlText, targetTable) {
  const escapedTable = targetTable.replace('.', '\\.');
  const stmtRegex = new RegExp(`INSERT\\s+INTO\\s+${escapedTable}\\b[^;]*;`, 'gi');
  let match;
  while ((match = stmtRegex.exec(sqlText)) !== null) {
    if (/ON\s+CONFLICT\b[^;]*\bDO\s+UPDATE\b/i.test(match[0])) {
      return true;
    }
  }
  return false;
}

function runStaticValidation() {
  console.log('======================================================================');
  console.log('SMART RESTAURANT POS — REGEX STATIC SQL VALIDATOR (NO DB EXECUTION)');
  console.log('======================================================================');
  console.log('[INFO] Mode: LOCAL READ-ONLY CODE LINTING (Zero cloud or DB connections)\n');

  // Check 1: Test SQL file existence
  const fileExists = fs.existsSync(testSqlPath);
  if (!fileExists) {
    console.error('ERROR: Test file not found at:', testSqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(testSqlPath, 'utf8');

  // Check 2: UUID validity across entire file
  const uuidRegex = /'([0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12})'/g;
  const hexUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  let uuidMatch;
  const invalidUuids = [];
  const scannedUuids = new Set();
  while ((uuidMatch = uuidRegex.exec(sql)) !== null) {
    const candidate = uuidMatch[1];
    scannedUuids.add(candidate);
    if (!hexUuidRegex.test(candidate)) {
      invalidUuids.push(candidate);
    }
  }

  // Check 3: Transaction and block delimiters check
  const beginMatches = (sql.match(/^\s*BEGIN\s*;/im) || []).length;
  const rollbackMatches = (sql.match(/^\s*ROLLBACK\s*;/im) || []).length;
  const doBlocksCount = (sql.match(/DO\s+\$\$/g) || []).length;
  const endDoBlocksCount = (sql.match(/\$\$;/g) || []).length;
  const balancedDelimiters = beginMatches === 1 && rollbackMatches === 1 && doBlocksCount === endDoBlocksCount && doBlocksCount > 0 && /\bROLLBACK;\s*$/i.test(sql);

  // Check 4: Collision checks verification across all 14 schema tables
  const collisionTableChecks = [
    { name: 'auth.users', regex: /SELECT\s+1\s+FROM\s+auth\.users/i },
    { name: 'public.profiles', regex: /SELECT\s+1\s+FROM\s+public\.profiles/i },
    { name: 'public.tenants', regex: /SELECT\s+1\s+FROM\s+public\.tenants/i },
    { name: 'public.branches', regex: /SELECT\s+1\s+FROM\s+public\.branches/i },
    { name: 'public.roles', regex: /SELECT\s+1\s+FROM\s+public\.roles/i },
    { name: 'public.permissions', regex: /SELECT\s+1\s+FROM\s+public\.permissions/i },
    { name: 'public.menu_categories', regex: /SELECT\s+1\s+FROM\s+public\.menu_categories/i },
    { name: 'public.menu_items', regex: /SELECT\s+1\s+FROM\s+public\.menu_items/i },
    { name: 'public.dining_tables', regex: /SELECT\s+1\s+FROM\s+public\.dining_tables/i },
    { name: 'public.memberships', regex: /SELECT\s+1\s+FROM\s+public\.memberships/i },
    { name: 'public.item_variants', regex: /SELECT\s+1\s+FROM\s+public\.item_variants/i },
    { name: 'public.modifier_groups', regex: /SELECT\s+1\s+FROM\s+public\.modifier_groups/i },
    { name: 'public.modifiers', regex: /SELECT\s+1\s+FROM\s+public\.modifiers/i },
    { name: 'public.menu_item_modifiers', regex: /SELECT\s+1\s+FROM\s+public\.menu_item_modifiers/i }
  ];

  const missingCollisionTables = collisionTableChecks
    .filter(tc => !tc.regex.test(sql))
    .map(tc => tc.name);

  // Check 5: Individual catalog child table collision checks
  const checksItemVariants = /SELECT\s+1\s+FROM\s+public\.item_variants/i.test(sql);
  const checksModifierGroups = /SELECT\s+1\s+FROM\s+public\.modifier_groups/i.test(sql);
  const checksModifiers = /SELECT\s+1\s+FROM\s+public\.modifiers/i.test(sql);
  const checksMenuItemModifiers = /SELECT\s+1\s+FROM\s+public\.menu_item_modifiers/i.test(sql);
  const allFourCatalogChildrenChecked = checksItemVariants && checksModifierGroups && checksModifiers && checksMenuItemModifiers;

  // Check 6: Statement-scoped unsafe ON CONFLICT DO UPDATE check
  const hasUnsafeAuthConflict = hasUnsafeDoUpdate(sql, 'auth.users');
  const hasUnsafeProfileConflict = hasUnsafeDoUpdate(sql, 'public.profiles');

  // Check 7: Test-specific role codes
  const usesTestRoleCodes = /'TEST_RLS_OWNER'/i.test(sql) &&
                            /'TEST_RLS_WAITER'/i.test(sql) &&
                            /'TEST_RLS_CASHIER'/i.test(sql) &&
                            /'TEST_RLS_MANAGER'/i.test(sql) &&
                            /code\s+IN\s*\([^)]*'TEST_RLS_OWNER'[^)]*\)/i.test(sql);

  // Check 8: Actual role ID retrieval and consistent usage
  const retrievesActualRoleIds = /SELECT\s+id\s+INTO\s+v_role_owner_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'TEST_RLS_OWNER'/i.test(sql) &&
                                 /SELECT\s+id\s+INTO\s+v_role_waiter_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'TEST_RLS_WAITER'/i.test(sql) &&
                                 /SELECT\s+id\s+INTO\s+v_role_cashier_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'TEST_RLS_CASHIER'/i.test(sql) &&
                                 /SELECT\s+id\s+INTO\s+v_role_manager_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'TEST_RLS_MANAGER'/i.test(sql);

  const usesRetrievedRoleIds = /INSERT\s+INTO\s+public\.role_permissions\s*\([^)]*role_id[^)]*\)\s*SELECT\s+v_role_owner_id/i.test(sql) &&
                               /INSERT\s+INTO\s+public\.memberships[\s\S]+?v_role_owner_id/i.test(sql);

  // Check 9: Permission fixture safety and ID retrieval
  const retrievesActualPermissionIds = /SELECT\s+id\s+INTO\s+v_p_tenant_update\s+FROM\s+public\.permissions\s+WHERE\s+code\s*=\s*'tenant\.update'/i.test(sql) &&
                                       /SELECT\s+id\s+INTO\s+v_p_branch_manage\s+FROM\s+public\.permissions\s+WHERE\s+code\s*=\s*'branch\.manage'/i.test(sql) &&
                                       /INSERT\s+INTO\s+public\.permissions[\s\S]+?ON\s+CONFLICT\s*\(code\)\s*DO\s+NOTHING/i.test(sql);

  // Check 10: Baseline fixture existence assertions
  const baselineFixtureAssertions = /FIXTURE\s+INTEGRITY\s+ERROR/i.test(sql) &&
                                    /NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.menu_items/i.test(sql) &&
                                    /NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.roles\s+WHERE\s+id\s*=\s*v_role_owner_id\s+AND\s+code\s*=\s*'TEST_RLS_OWNER'\)/i.test(sql);

  // Check 11: SUPER_ADMIN prerequisite check without fabrication
  const superAdminPrerequisiteCheck = /SELECT\s+id\s+INTO\s+v_super_role_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'SUPER_ADMIN'\s+AND\s+tenant_id\s+IS\s+NULL/i.test(sql) &&
                                      /PREREQUISITE\s+ERROR:\s+Required\s+global\s+role\s+SUPER_ADMIN\s+not\s+found/i.test(sql) &&
                                      !/INSERT\s+INTO\s+public\.roles[^;]+?'SUPER_ADMIN'/i.test(sql);

  // Check 12: Test 6.1 independent DCL inspection
  const test61DclClassification = /has_schema_privilege\('authenticated',\s*'public',\s*'USAGE'\)/i.test(sql) &&
                                  /has_table_privilege\('authenticated',\s*'public\.platform_superadmins',\s*'INSERT'\)/i.test(sql) &&
                                  /Table-Level\s+INSERT\s+Privilege\s+Revocation\s*\(DCL\)/i.test(sql) &&
                                  /RLS\s+Policy\s+Enforcement/i.test(sql) &&
                                  /WHEN\s+OTHERS\s+THEN/i.test(sql);

  // Check 13: Test 7 independent schema and table privilege inspection
  const test7IndependentPrivileges = /SET\s+LOCAL\s+ROLE\s+anon;/i.test(sql) &&
                                     /v_has_public_usage\s*:=\s*has_schema_privilege\('anon',\s*'public',\s*'USAGE'\);/i.test(sql) &&
                                     /v_has_table_select\s*:=\s*has_table_privilege\('anon',\s*'public\.tenants',\s*'SELECT'\);/i.test(sql) &&
                                     /v_has_table_select\s*:=\s*has_table_privilege\('anon',\s*'public\.dining_tables',\s*'SELECT'\);/i.test(sql) &&
                                     /v_has_table_select\s*:=\s*has_table_privilege\('anon',\s*'public\.menu_items',\s*'SELECT'\);/i.test(sql) &&
                                     /v_has_table_select\s*:=\s*has_table_privilege\('anon',\s*'public\.roles',\s*'SELECT'\);/i.test(sql);

  // Check 14: Test 7 denial classification (RLS vs DCL vs schema boundary)
  const test7DenialClassification = /Row\s+Level\s+Security\s+Zero-Row\s+Filter/i.test(sql) &&
                                    /Table-Level\s+SELECT\s+Privilege\s+Revocation\s*\(DCL\)/i.test(sql) &&
                                    /Private\s+Schema\/Function\s+Permission\s+Boundary/i.test(sql) &&
                                    /SQLSTATE\s+42501\s+Privilege\s+Denial/i.test(sql) &&
                                    /WHEN\s+OTHERS\s+THEN/i.test(sql);

  // Check 15: Test 10 custom role tenant assertion
  const test10CustomRoleTenant = /SELECT\s+id\s+INTO\s+v_custom_role_id\s+FROM\s+public\.roles\s+WHERE\s+code\s*=\s*'TEST_RLS_CUSTOM_A'\s+AND\s+tenant_id\s*=\s*'a0000000-0000-0000-0000-000000000001'/i.test(sql) &&
                                 /PREREQUISITE\s+ERROR:\s+Role\s+TEST_RLS_CUSTOM_A\s+belonging\s+to\s+Tenant\s+A\s+not\s+found/i.test(sql);

  // Check 16: Test 10 membership INSERT privilege assertion
  const test10MembershipInsertPrivilege = /has_table_privilege\('authenticated',\s*'public\.memberships',\s*'INSERT'\)/i.test(sql) &&
                                          /Cross-tenant\s+custom\s+role\s+assignment\s+blocked\s+by\s+memberships\s+WITH\s+CHECK/i.test(sql) &&
                                          /Privileged\s+SUPER_ADMIN\s+role\s+assignment\s+blocked\s+by\s+memberships\s+WITH\s+CHECK/i.test(sql);

  // Check 17: Test 11.1 pre-update privileges and initial active-row check
  const test111PreUpdateCheck = /has_schema_privilege\('authenticated',\s*'public',\s*'USAGE'\)/i.test(sql) &&
                                /has_table_privilege\('authenticated',\s*'public\.dining_tables',\s*'UPDATE'\)/i.test(sql) &&
                                /SELECT\s+deleted_at\s+INTO\s+v_initial_deleted_at\s+FROM\s+public\.dining_tables/i.test(sql) &&
                                /Dining\s+table\s+is\s+already\s+soft-deleted/i.test(sql);

  // Check 18: Test 11.1 distinguishes zero-row USING filter from WITH CHECK
  const test111DistinguishUsingVsCheck = /Update\s+matched\s+0\s+rows\s+due\s+to\s+USING\s+filter/i.test(sql) &&
                                         /dining_tables\s+WITH\s+CHECK/i.test(sql);

  // Check 19: Test 11 post-check active-row preservation in privileged context
  const test11PostCheckPreservation = /TEST\s+11\s+POST-CHECK/i.test(sql) &&
                                      /SELECT\s+deleted_at,\s*status\s+INTO\s+v_final_deleted_at,\s*v_final_status/i.test(sql) &&
                                      /v_final_deleted_at\s+IS\s+NOT\s+NULL\s+THEN/i.test(sql) &&
                                      /v_final_status\s*<>\s*'OCCUPIED'\s+THEN/i.test(sql) &&
                                      /deleted_at\s+IS\s+NULL\s+and\s+status\s*=\s*OCCUPIED/i.test(sql);

  // Check 20: Test 11.2 status update verification
  const test112StatusUpdate = /UPDATE\s+public\.dining_tables\s+SET\s+status\s*=\s*'OCCUPIED'/i.test(sql) &&
                              /v_affected\s*<>\s*1\s+THEN/i.test(sql) &&
                              /affected\s+exactly\s+1\s+row/i.test(sql);

  // Check 21: Role switching and restoration
  const roleSwitchingAndRestoration = /SET\s+LOCAL\s+ROLE\s+authenticated;/i.test(sql) &&
                                      /SET\s+LOCAL\s+ROLE\s+anon;/i.test(sql) &&
                                      /RESET\s+ROLE;/i.test(sql);

  // Check 22: JWT claims injection and reset
  const jwtClaimsInjectionAndReset = /SET\s+LOCAL\s+"request\.jwt\.claims"\s*=/i.test(sql) &&
                                     /SET\s+LOCAL\s+"request\.jwt\.claims"\s*=\s*'';/i.test(sql);

  // Check 23: Anti-bypass guards
  const antiBypassGuards = /current_user\s*<>\s*'authenticated'/i.test(sql) &&
                           /current_user\s*<>\s*'anon'/i.test(sql) &&
                           /rolsuper\s*=\s*TRUE\s+OR\s+rolbypassrls\s*=\s*TRUE/i.test(sql) &&
                           /auth\.uid\(\)\s+IS\s+DISTINCT\s+FROM/i.test(sql) &&
                           /auth\.uid\(\)\s+IS\s+NOT\s+NULL/i.test(sql);

  // Check 24: Test 5.2 schema USAGE, branches INSERT privilege, and DCL vs RLS classification
  const test52DclAndRls = /has_schema_privilege\('authenticated',\s*'public',\s*'USAGE'\)/i.test(sql) &&
                          /has_table_privilege\('authenticated',\s*'public\.branches',\s*'INSERT'\)/i.test(sql) &&
                          /Table-Level\s+INSERT\s+Privilege\s+Revocation\s*\(DCL\)/i.test(sql) &&
                          /branches\s+RLS\s+WITH\s+CHECK/i.test(sql) &&
                          /WHEN\s+OTHERS\s+THEN/i.test(sql);

  // Check 25: Test 6.2 checks app_private USAGE privilege and wraps is_superadmin() in an exception block
  const test62SafeSuperadminCall = /has_schema_privilege\('authenticated',\s*'app_private',\s*'USAGE'\)/i.test(sql) &&
                                   /Private\s+Schema\s+Permission\s+Boundary\s*\(app_private\s+USAGE\s+revoked\)/i.test(sql) &&
                                   /is_superadmin\(\)[\s\S]+?EXCEPTION[\s\S]+?WHEN\s+insufficient_privilege\s+OR\s+SQLSTATE\s+'42501'/i.test(sql) &&
                                   /(?:v_is_admin\s*=\s*FALSE|app_private\.is_superadmin\(\)\s*=\s*FALSE)/i.test(sql);

  // Check 26: Test 10 role IDs pre-retrieved in postgres context before role switch and passed via transaction GUC
  const test10PostgresRolePreRetrieval = /TEST\s+10:[\s\S]+?DO\s+\$\$[\s\S]+?SELECT\s+id\s+INTO\s+v_custom_role_id\s+FROM\s+public\.roles[\s\S]+?SELECT\s+id\s+INTO\s+v_super_role_id\s+FROM\s+public\.roles[\s\S]+?set_config\('test_context\.custom_role_id'[\s\S]+?set_config\('test_context\.super_role_id'[\s\S]+?\$\$;[\s\S]+?SET\s+LOCAL\s+ROLE\s+authenticated;[\s\S]+?current_setting\('test_context\.custom_role_id'/i.test(sql);

  // Check 27: security_and_rls_test.sql exists and contains no syntax-breaking END IF after WHEN OTHERS THEN
  const securitySqlPath = path.join(__dirname, 'security_and_rls_test.sql');
  const securityFileExists = fs.existsSync(securitySqlPath);
  let securitySyntaxValid = false;
  let securityCheckDetails = '';

  if (securityFileExists) {
    const securitySql = fs.readFileSync(securitySqlPath, 'utf8');
    const hasBrokenEndIf = /EXCEPTION\s+WHEN\s+OTHERS\s+THEN[\s\S]{1,250}?\bEND\s+IF\s*;/i.test(securitySql);
    const hasProperEnd = /EXCEPTION\s+WHEN\s+OTHERS\s+THEN[\s\S]{1,250}?\bEND\s*;/i.test(securitySql);
    securitySyntaxValid = !hasBrokenEndIf && hasProperEnd;
    securityCheckDetails = securitySyntaxValid
      ? 'Verified security_and_rls_test.sql has valid EXCEPTION block syntax terminated with END; (no mismatched END IF;).'
      : (hasBrokenEndIf ? 'Found invalid END IF; terminating EXCEPTION block in security_and_rls_test.sql!' : 'Could not confirm proper END; in security_and_rls_test.sql.');
  } else {
    securityCheckDetails = 'File security_and_rls_test.sql not found!';
  }

  const validationChecks = [
    {
      id: 'CHECK_1_FILE_EXISTS',
      title: 'Filesystem assertion: rls_isolation_test.sql exists',
      passed: fileExists,
      details: 'Verified test SQL file is present in expected directory.'
    },
    {
      id: 'CHECK_2_UUID_HEXADECIMAL_SYNTAX',
      title: 'Regex pattern validation: Valid hexadecimal PostgreSQL UUID syntax',
      passed: invalidUuids.length === 0 && scannedUuids.size >= 25,
      details: invalidUuids.length === 0
        ? `Verified ${scannedUuids.size} unique UUID literals; 100% conform to [0-9a-fA-F] hex format.`
        : `Found invalid non-hex UUIDs: ${invalidUuids.join(', ')}`
    },
    {
      id: 'CHECK_3_BALANCED_TRANSACTION_DELIMITERS',
      title: 'Token-based validation: Balanced transaction and DO $$ block delimiters',
      passed: balancedDelimiters,
      details: `BEGIN (${beginMatches}), ROLLBACK (${rollbackMatches}), DO $$ blocks (${doBlocksCount}/${endDoBlocksCount}), concluding with ROLLBACK.`
    },
    {
      id: 'CHECK_4_COMPREHENSIVE_COLLISION_PRECHECKS',
      title: 'Pattern verification: Preflight collision checks across all 14 schema tables',
      passed: missingCollisionTables.length === 0,
      details: missingCollisionTables.length === 0
        ? 'Verified explicit collision preflight checks covering all 14 claimed schema tables.'
        : `Missing preflight collision checks for tables: ${missingCollisionTables.join(', ')}`
    },
    {
      id: 'CHECK_5_CATALOG_CHILD_COLLISION_CHECKS',
      title: 'Pattern verification: Individual collision checks for all four catalog child tables',
      passed: allFourCatalogChildrenChecked,
      details: `Verified individual preflight checks: item_variants (${checksItemVariants}), modifier_groups (${checksModifierGroups}), modifiers (${checksModifiers}), menu_item_modifiers (${checksMenuItemModifiers}).`
    },
    {
      id: 'CHECK_6_SAFE_STATEMENT_SCOPED_INSERTS',
      title: 'Regex pattern assertion: Statement-scoped check for absence of ON CONFLICT DO UPDATE on auth and profiles',
      passed: !hasUnsafeAuthConflict && !hasUnsafeProfileConflict,
      details: 'Ensures test runner never overwrites pre-existing auth.users or public.profiles accounts.'
    },
    {
      id: 'CHECK_7_TEST_SPECIFIC_ROLE_CODES',
      title: 'Pattern verification: Dedicated test-specific role codes with preflight collision checks',
      passed: usesTestRoleCodes,
      details: 'Verified TEST_RLS_OWNER, TEST_RLS_WAITER, TEST_RLS_CASHIER, and TEST_RLS_MANAGER role codes and collision check.'
    },
    {
      id: 'CHECK_8_ROLE_ID_RETRIEVAL_AND_USAGE',
      title: 'Pattern verification: Actual role ID retrieval and consistent usage in role_permissions/memberships',
      passed: retrievesActualRoleIds && usesRetrievedRoleIds,
      details: 'Role IDs retrieved via SELECT id INTO and referenced directly in foreign key relationships.'
    },
    {
      id: 'CHECK_9_PERMISSION_ID_RETRIEVAL_AND_SAFETY',
      title: 'Pattern verification: Permission ID retrieval by code preserving existing production metadata',
      passed: retrievesActualPermissionIds,
      details: 'Permissions inserted with ON CONFLICT DO NOTHING and actual permission IDs retrieved by code.'
    },
    {
      id: 'CHECK_10_BASELINE_FIXTURE_ASSERTIONS',
      title: 'Pattern verification: Baseline fixture assertions confirming existence before RLS execution',
      passed: baselineFixtureAssertions,
      details: 'Guarantees downstream tests cannot produce false-positive passes from absent fixtures.'
    },
    {
      id: 'CHECK_11_SUPER_ADMIN_PREREQUISITE_CHECK',
      title: 'Pattern verification: SUPER_ADMIN verified as prerequisite without fabrication or mutation',
      passed: superAdminPrerequisiteCheck,
      details: 'Verified global SUPER_ADMIN role is asserted as a pre-existing prerequisite and not inserted in test fixtures.'
    },
    {
      id: 'CHECK_12_TEST_6_1_INDEPENDENT_DCL_AND_RLS',
      title: 'Pattern verification: Test 6.1 independent public USAGE and table INSERT privilege inspection',
      passed: test61DclClassification,
      details: 'Independently inspects schema USAGE and table INSERT; distinguishes Table Privilege Denial from RLS Policy Enforcement.'
    },
    {
      id: 'CHECK_13_TEST_7_INDEPENDENT_ANON_PRIVILEGES',
      title: 'Pattern verification: Test 7 independent schema USAGE and table SELECT inspection per table',
      passed: test7IndependentPrivileges,
      details: 'Independently evaluates schema USAGE and table SELECT privileges across tenants, dining_tables, menu_items, and roles.'
    },
    {
      id: 'CHECK_14_TEST_7_DENIAL_CLASSIFICATION',
      title: 'Pattern verification: Test 7 distinguishes RLS zero-row, DCL table denial, and schema boundary',
      passed: test7DenialClassification,
      details: 'Distinguishes RLS Zero-Row Filter, Table-Level SELECT Revocation, and Private Schema Boundary; never classifies generic 42501 as RLS.'
    },
    {
      id: 'CHECK_15_TEST_10_CUSTOM_ROLE_TENANT_CHECK',
      title: 'Pattern verification: Test 10.1 asserts custom role exists and belongs to Tenant A',
      passed: test10CustomRoleTenant,
      details: 'Asserts custom role belongs to Tenant A before testing cross-tenant membership assignment rejection.'
    },
    {
      id: 'CHECK_16_TEST_10_MEMBERSHIP_INSERT_PRIVILEGE',
      title: 'Pattern verification: Test 10 checks membership INSERT privilege before classifying RLS WITH CHECK',
      passed: test10MembershipInsertPrivilege,
      details: 'Verifies table INSERT privilege on public.memberships before interpreting 42501 as RLS WITH CHECK rejection.'
    },
    {
      id: 'CHECK_17_TEST_11_1_PRE_UPDATE_PRIVILEGES_AND_STATE',
      title: 'Pattern verification: Test 11.1 checks UPDATE privilege, schema USAGE, and initial active-row state',
      passed: test111PreUpdateCheck,
      details: 'Asserts table UPDATE and schema USAGE privileges and confirms initial deleted_at IS NULL before attempt.'
    },
    {
      id: 'CHECK_18_TEST_11_1_DISTINGUISH_USING_VS_WITH_CHECK',
      title: 'Pattern verification: Test 11.1 distinguishes 0-row USING filter from WITH CHECK rejection',
      passed: test111DistinguishUsingVsCheck,
      details: 'Explicitly catches update matched 0 rows as test failure, confirming RLS WITH CHECK policy evaluation.'
    },
    {
      id: 'CHECK_19_TEST_11_POST_CHECK_ACTIVE_ROW_PRESERVATION',
      title: 'Pattern verification: Test 11 post-check verifies active-row preservation in privileged context',
      passed: test11PostCheckPreservation,
      details: 'Restores privileged session context and asserts deleted_at IS NULL and status = OCCUPIED.'
    },
    {
      id: 'CHECK_20_TEST_11_2_STATUS_UPDATE_VERIFICATION',
      title: 'Pattern verification: Test 11.2 verifies exactly one affected row and status = OCCUPIED update',
      passed: test112StatusUpdate,
      details: 'Verifies waiter successfully updates active table status to OCCUPIED with row_count = 1.'
    },
    {
      id: 'CHECK_21_ROLE_SWITCHING_AND_RESTORATION',
      title: 'Regex pattern validation: Top-level SET LOCAL ROLE switches and explicit RESET ROLE restoration',
      passed: roleSwitchingAndRestoration,
      details: 'Switches session away from postgres to enforce RLS and restores privileged context cleanly.'
    },
    {
      id: 'CHECK_22_JWT_CLAIMS_INJECTION_AND_RESET',
      title: 'Regex pattern validation: Transaction-local request.jwt.claims injection and clean reset',
      passed: jwtClaimsInjectionAndReset,
      details: 'Allows auth.uid() to resolve to target test user UUID and resets claims between test blocks.'
    },
    {
      id: 'CHECK_23_ANTI_BYPASS_GUARDS',
      title: 'Regex pattern assertion: Anti-bypass guards checking current_user, rolsuper/rolbypassrls, and auth.uid()',
      passed: antiBypassGuards,
      details: 'Aborts test immediately if execution bypasses RLS or possesses unexpected superuser attributes.'
    },
    {
      id: 'CHECK_24_TEST_5_2_DCL_AND_RLS_CLASSIFICATION',
      title: 'Pattern verification: Test 5.2 checks public USAGE and branch INSERT before RLS WITH CHECK',
      passed: test52DclAndRls,
      details: 'Verifies public USAGE and table INSERT privilege; distinguishes Table Privilege Denial (DCL) from branches WITH CHECK policy.'
    },
    {
      id: 'CHECK_25_TEST_6_2_SAFE_SUPERADMIN_EXECUTION',
      title: 'Pattern verification: Test 6.2 checks app_private USAGE and wraps is_superadmin() in exception block',
      passed: test62SafeSuperadminCall,
      details: 'Prevents uncaught privilege denial from aborting suite; classifies private schema boundary and asserts is_superadmin() = FALSE.'
    },
    {
      id: 'CHECK_26_TEST_10_POSTGRES_ROLE_PRE_RETRIEVAL',
      title: 'Pattern verification: Test 10 role IDs pre-retrieved in postgres context and passed via transaction GUC',
      passed: test10PostgresRolePreRetrieval,
      details: 'Prevents client RLS SELECT policies from hiding prerequisite roles; retrieves in postgres context and passes via set_config/current_setting.'
    },
    {
      id: 'CHECK_27_SECURITY_AND_RLS_TEST_SYNTAX_VALID',
      title: 'Filesystem and syntax assertion: security_and_rls_test.sql has valid block syntax (no END IF after EXCEPTION)',
      passed: securityFileExists && securitySyntaxValid,
      details: securityCheckDetails
    }
  ];

  let allPassed = true;
  for (const check of validationChecks) {
    const statusLabel = check.passed
      ? '[STATIC REGEX PASS - NO DB EXECUTION]'
      : '[STATIC REGEX FAIL]';
    console.log(`${statusLabel} ${check.id}: ${check.title}`);
    console.log(`   --> ${check.details}`);
    if (!check.passed) {
      allPassed = false;
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log('EXECUTION TIER STATUS REPORT:');
  console.log('  [A] Static Regex & Token Linting:      ' + (allPassed ? 'PASSED (27/27 checks passed)' : 'FAILED'));
  console.log('  [B] PostgreSQL Kernel Transaction:     NOT PERFORMED (Zero DB connections; execute via Supabase SQL Editor)');
  console.log('----------------------------------------------------------------------');

  if (allPassed) {
    console.log('OVERALL LINTER VERDICT: All 27 static checks PASSED. SQL suite and validator are fully synchronized.\n');
    process.exit(0);
  } else {
    console.error('OVERALL LINTER VERDICT: Static validation failed with defects.\n');
    process.exit(1);
  }
}

// Execute static validation
runStaticValidation();
