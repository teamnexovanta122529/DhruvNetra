/**
 * DHRUVNETRA - Centralized Authentication & Authorization Data
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 * 
 * PROTOTYPE IMPLEMENTATION NOTE:
 * This layer provides role-based access control (RBAC) with 3 standard operational roles:
 * - ADMIN: Full mission command, What-If simulation engine, Government directives, Reports, All stations.
 * - OPERATOR: Subsystem monitoring (Power, Fuel, HVAC, Water, Environment, Logistics, Alerts).
 * - VIEWER: Read-only telemetry monitoring dashboards.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  VIEWER: "VIEWER",
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
  {
    id: "usr-004",
    username: "viewer",
    password: "viewer123",
    role: ROLES.VIEWER,
    stations: ["MAITRI", "BHARATI"],
    name: "Observer R. Iyer",
    title: "Scientific Observer & Telemetry Analyst",
    clearance: "LEVEL-1 SCIENTIFIC MONITORING (READ-ONLY)",
    email: "r.iyer@polar.dhruvnetra.gov.in",
    avatar: "RI",
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
  [ROLES.VIEWER]: {
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
 */
export async function mockAuthenticate(username, password) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

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

  // Return sanitized user object (omit password)
  const { password: _, ...sanitizedUser } = user;
  return sanitizedUser;
}

/**
 * Verify if user is authorized for a specific station
 */
export function isUserAuthorizedForStation(user, stationName) {
  if (!user || !user.stations) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.VIEWER) return true;
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

export default {
  ROLES,
  MOCK_USERS,
  ROLE_PERMISSIONS,
  ADMIN_ONLY_ROUTES,
  mockAuthenticate,
  isUserAuthorizedForStation,
  isRoleAuthorizedForRoute,
};
