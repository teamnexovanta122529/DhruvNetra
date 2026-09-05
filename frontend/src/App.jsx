import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StationProvider } from "./context/StationContext";
import CustomCursor from "./components/landing/CustomCursor";
import LandingPage from "./components/landing/LandingPage";

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
            <StationProvider>
                <CustomCursor />

                <Routes>

                    {/* Landing */}

                    <Route
                        path="/"
                        element={<LandingPage />}
                    />


                    {/* Dashboard */}

                    <Route
                        path="/dashboard"
                        element={<DashboardLayout />}
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

                        <Route
                            path="what-if"
                            element={<WhatIfAnalysis />}
                        />

                        <Route
                            path="government"
                            element={<GovernmentCommand />}
                        />

                        <Route
                            path="reports"
                            element={<Reports />}
                        />

                    </Route>

                </Routes>
            </StationProvider>
        </BrowserRouter>
    );
}

export default App;