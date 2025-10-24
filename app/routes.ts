import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("forgot-password", "routes/forgot-password.tsx"),
    route("reset-password/:uid/:token", "routes/reset-password.$uid.$token.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("profile", "routes/profile.tsx"),
    route("security", "routes/security.tsx"),
] satisfies RouteConfig;
