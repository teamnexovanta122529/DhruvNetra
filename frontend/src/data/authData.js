/**
 * DHRUVNETRA - Centralized Authentication & Authorization Data
 * 
 * PROTOTYPE IMPLEMENTATION NOTE:
 * This is a frontend prototype with mock authentication.
 * In a production deployment, this layer will be replaced with:
 *   Frontend -> Auth API -> JWT / Supabase Auth -> Backend RBAC & Session Management
 * Do not claim frontend-only authentication is production-grade security.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
};

export const MOCK_USERS = [
  {
    id: "usr-001",
    username: "admin",
    password: "admin123",
    role: ROLES.ADMIN,
    stations: ["MAITRI", "BHARATI"],
    name: "Commander A. Sharma",
    title: "Mission Director & Polar Station Chief",
    clearance: "LEVEL-4 POLAR COMMAND / DIRECTORATE",
    email: "a.sharma@dhruvnetra.ncpor.gov.in",
    avatar: "AS",
  },
  {
    id: "usr-002",
    username: "operator",
    password: "operator123",
    role: ROLES.OPERATOR,
    stations: ["BHARATI"],
    name: "Dr. K. Raman",
    title: "Lead Telemetry & Systems Operator",
    clearance: "LEVEL-2 OPERATIONAL TELEMETRY",
    email: "k.raman@bharati.dhruvnetra.gov.in",
    avatar: "KR",
  },
  {
    id: "usr-003",
    username: "maitri.operator",
    password: "maitri123",
    role: ROLES.OPERATOR,
    stations: ["MAITRI"],
    name: "Eng. S. Mukherjee",
    title: "Station Operations Engineer",
    clearance: "LEVEL-2 OPERATIONAL TELEMETRY",
    email: "s.mukherjee@maitri.dhruvnetra.gov.in",
    avatar: "SM",
  },
];

/**
 * Route / Module permissions map by role
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canAccessAllStations: true,
    allowedRoutes: [
      "/dashboard/overview",
      "/dashboard/digital-twin",
      "/dashboard/power",
      "/dashboard/fuel",
      "/dashboard/hvac",
      "/dashboard/water",
      "/dashboard/environment",
      "/dashboard/logistics",
      "/dashboard/alerts",
      "/dashboard/what-if",
      "/dashboard/government",
      "/dashboard/reports",
    ],
    canExecuteWhatIf: true,
    canTransmitGovernmentCommands: true,
    canAccessSensitiveReports: true,
  },
  [ROLES.OPERATOR]: {
    canAccessAllStations: false,
    allowedRoutes: [
      "/dashboard/overview",
      "/dashboard/digital-twin",
      "/dashboard/power",
      "/dashboard/fuel",
      "/dashboard/hvac",
      "/dashboard/water",
      "/dashboard/environment",
      "/dashboard/logistics",
      "/dashboard/alerts",
    ],
    canExecuteWhatIf: false,
    canTransmitGovernmentCommands: false,
    canAccessSensitiveReports: false,
  },
};

/**
 * Admin-only route paths
 */
export const ADMIN_ONLY_ROUTES = [
  "/dashboard/what-if",
  "/dashboard/government",
  "/dashboard/reports",
];

/**
 * Mock authentication function
 * Simulated async delay to mimic network latency
 */
export async function mockAuthenticate(username, password) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const trimmedUsername = username?.trim().toLowerCase();
  const trimmedPassword = password?.trim();

  const user = MOCK_USERS.find(
    (u) =>
      (u.username.toLowerCase() === trimmedUsername ||
        u.email.toLowerCase() === trimmedUsername) &&
      u.password === trimmedPassword
  );

  if (!user) {
    throw new Error("Invalid username/email or password. Please verify credentials.");
  }

  // Return sanitized user object (omit password in returned state)
  const { password: _, ...sanitizedUser } = user;
  return sanitizedUser;
}

/**
 * Verify if user is authorized for a specific station
 */
export function isUserAuthorizedForStation(user, stationName) {
  if (!user || !user.stations) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.stations.includes(stationName);
}

/**
 * Verify if a role is authorized for a specific route
 */
export function isRoleAuthorizedForRoute(role, routePath) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  const cleanPath = routePath.replace(/\/$/, "");
  return permissions.allowedRoutes.some((allowed) =>
    cleanPath.startsWith(allowed)
  );
}
