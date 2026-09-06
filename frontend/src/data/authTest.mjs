import {
  MOCK_USERS,
  ROLES,
  mockAuthenticate,
  isUserAuthorizedForStation,
  isRoleAuthorizedForRoute,
  ADMIN_ONLY_ROUTES,
} from "./authData.js";

async function runAuthTests() {
  console.log("=========================================");
  console.log(" RUNNING DHRUVNETRA AUTH & RBAC VERIFICATION");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Admin credentials and stations
  try {
    const admin = await mockAuthenticate("admin", "admin123");
    assert(admin.role === ROLES.ADMIN, "Admin user has role ADMIN");
    assert(
      isUserAuthorizedForStation(admin, "MAITRI") === true,
      "Admin is authorized for MAITRI"
    );
    assert(
      isUserAuthorizedForStation(admin, "BHARATI") === true,
      "Admin is authorized for BHARATI"
    );
  } catch (err) {
    assert(false, `Admin auth failed: ${err.message}`);
  }

  // TEST 2: Bharati Operator credentials and stations
  try {
    const operator = await mockAuthenticate("operator", "operator123");
    assert(operator.role === ROLES.OPERATOR, "Operator user has role OPERATOR");
    assert(
      isUserAuthorizedForStation(operator, "BHARATI") === true,
      "Operator is authorized for BHARATI"
    );
    assert(
      isUserAuthorizedForStation(operator, "MAITRI") === false,
      "Operator is NOT authorized for MAITRI"
    );
  } catch (err) {
    assert(false, `Operator auth failed: ${err.message}`);
  }

  // TEST 3: Maitri Operator credentials and stations
  try {
    const maitriOp = await mockAuthenticate("maitri.operator", "maitri123");
    assert(maitriOp.role === ROLES.OPERATOR, "Maitri Operator has role OPERATOR");
    assert(
      isUserAuthorizedForStation(maitriOp, "MAITRI") === true,
      "Maitri Operator is authorized for MAITRI"
    );
    assert(
      isUserAuthorizedForStation(maitriOp, "BHARATI") === false,
      "Maitri Operator is NOT authorized for BHARATI"
    );
  } catch (err) {
    assert(false, `Maitri Operator auth failed: ${err.message}`);
  }

  // TEST 4: Invalid credentials rejection
  try {
    await mockAuthenticate("admin", "wrongpass");
    assert(false, "Invalid password should fail");
  } catch (err) {
    assert(true, "Invalid password correctly rejected with error");
  }

  try {
    await mockAuthenticate("unknown.user", "admin123");
    assert(false, "Unknown user should fail");
  } catch (err) {
    assert(true, "Unknown user correctly rejected with error");
  }

  // TEST 5: RBAC Route Authorization
  // Admin module permissions
  ADMIN_ONLY_ROUTES.forEach((route) => {
    assert(
      isRoleAuthorizedForRoute(ROLES.ADMIN, route) === true,
      `ADMIN is authorized for sensitive route: ${route}`
    );
    assert(
      isRoleAuthorizedForRoute(ROLES.OPERATOR, route) === false,
      `OPERATOR is BLOCKED from sensitive route: ${route}`
    );
  });

  // Monitoring routes for Operator
  const monitoringRoutes = [
    "/dashboard/overview",
    "/dashboard/digital-twin",
    "/dashboard/power",
    "/dashboard/fuel",
    "/dashboard/hvac",
    "/dashboard/water",
    "/dashboard/environment",
    "/dashboard/logistics",
    "/dashboard/alerts",
  ];

  monitoringRoutes.forEach((route) => {
    assert(
      isRoleAuthorizedForRoute(ROLES.OPERATOR, route) === true,
      `OPERATOR is authorized for monitoring route: ${route}`
    );
    assert(
      isRoleAuthorizedForRoute(ROLES.ADMIN, route) === true,
      `ADMIN is authorized for monitoring route: ${route}`
    );
  });

  console.log("\n=========================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================");

  if (failed > 0) process.exit(1);
}

runAuthTests();
