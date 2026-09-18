import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { StationProvider } from "./context/StationContext";
import { EnvironmentProvider } from "./context/EnvironmentContext";
import LandingPage from "./components/landing/LandingPage";
import Login from "./components/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import DashboardLayout from "./components/dashboard/DashboardLayout";

import Overview from "./components/dashboard/pages/Overview";
import DigitalTwin from "./components/dashboard/pages/DigitalTwin";
import PowerSystems from "./components/dashboard/pages/PowerSystems";
import FuelSystems from "./components/dashboard/pages/FuelSystems";
import HVACSystems from "./components/dashboard/pages/HVACSystems";
import WaterSystems from "./components/dashboard/pages/WaterSystems";
import Environment from "./components/dashboard/pages/Environment";
import Logistics from "./components/dashboard/pages/Logistics";
import Alerts from "./components/dashboard/pages/Alerts";
import WhatIfAnalysis from "./components/dashboard/pages/WhatIfAnalysis";
import GovernmentCommand from "./components/dashboard/pages/GovernmentCommand";
import Reports from "./components/dashboard/pages/Reports";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <StationProvider>
                    <EnvironmentProvider>
                        <Routes>

                        {/* Public: Landing */}
                        <Route
                            path="/"
                            element={<LandingPage />}
                        />

                        {/* Public / Auth: Secure Login Portal */}
                        <Route
                            path="/login"
                            element={<Login />}
                        />

                        {/* Protected: Dashboard Shell & Modules */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >

                            <Route
                                index
                                element={
                                    <Navigate
                                        to="/dashboard/overview"
                                        replace
                                    />
                                }
                            />

                            {/* Standard Monitoring Modules (Admin + Operator) */}
                            <Route
                                path="overview"
                                element={<Overview />}
                            />

                            <Route
                                path="digital-twin"
                                element={<DigitalTwin />}
                            />

                            <Route
                                path="power"
                                element={<PowerSystems />}
                            />

                            <Route
                                path="fuel"
                                element={<FuelSystems />}
                            />

                            <Route
                                path="hvac"
                                element={<HVACSystems />}
                            />

                            <Route
                                path="water"
                                element={<WaterSystems />}
                            />

                            <Route
                                path="environment"
                                element={<Environment />}
                            />

                            <Route
                                path="logistics"
                                element={<Logistics />}
                            />

                            <Route
                                path="alerts"
                                element={<Alerts />}
                            />

                            {/* Restricted Admin-Only Modules */}
                            <Route
                                path="what-if"
                                element={
                                    <AdminRoute>
                                        <WhatIfAnalysis />
                                    </AdminRoute>
                                }
                            />

                            <Route
                                path="government"
                                element={
                                    <AdminRoute>
                                        <GovernmentCommand />
                                    </AdminRoute>
                                }
                            />

                            <Route
                                path="reports"
                                element={
                                    <AdminRoute>
                                        <Reports />
                                    </AdminRoute>
                                }
                            />

                        </Route>

                        {/* Catch-all fallback */}
                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to="/"
                                    replace
                                />
                            }
                        />

                    </Routes>
                    </EnvironmentProvider>
                </StationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;