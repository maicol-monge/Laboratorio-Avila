import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ allowedPrivileges }) => {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
    const location = useLocation();

    useEffect(() => {
        const handleStorage = () => {
            setUser(JSON.parse(localStorage.getItem("user")));
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useEffect(() => {
        setUser(JSON.parse(localStorage.getItem("user")));
    }, [location.pathname]);

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Redirige a /administrador si requiere cambio y no está ya en esa ruta
    if (user.requiereCambioPassword === 1 && location.pathname !== "/administrador") {
        return <Navigate to="/administrador" replace />;
    }

    if (allowedPrivileges && !allowedPrivileges.includes(user.rol)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;