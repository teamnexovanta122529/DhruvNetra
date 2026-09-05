import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { useStation } from "../../context/StationContext";

export default function DashboardLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { station, setStation, stationInfo, stationData } = useStation();

    const handleToggleSidebar = () => {
        // On larger screens toggle collapsed; on smaller screens toggle mobile drawer
        if (typeof window !== "undefined" && window.innerWidth <= 900) {
            setMobileMenuOpen((prev) => !prev);
        } else {
            setSidebarCollapsed((prev) => !prev);
        }
    };

    const handleCloseMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <main
            className={`
                dashboard-shell
                ${sidebarCollapsed ? "sidebar-collapsed" : ""}
                ${mobileMenuOpen ? "mobile-sidebar-open" : ""}
            `}
        >

            <DashboardHeader
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={handleToggleSidebar}
            />

            <div className="dashboard-body">

                {/* MOBILE BACKDROP OVERLAY */}
                {mobileMenuOpen && (
                    <div
                        className="sidebar-backdrop"
                        onClick={handleCloseMobileMenu}
                    />
                )}

                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={handleToggleSidebar}
                    onItemClick={handleCloseMobileMenu}
                />

                <section className="dashboard-content">
                    <Outlet
                        context={{
                            station,
                            setStation,
                            stationInfo,
                            stationData,
                        }}
                    />
                </section>

            </div>

        </main>
    );
}