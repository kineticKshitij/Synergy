import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("forgot-password", "routes/forgot-password.tsx"),
    route("reset-password/:uid/:token", "routes/reset-password.$uid.$token.tsx"),
    route("terms", "routes/terms.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("team", "routes/team.tsx"),
    route("team-dashboard", "routes/team-dashboard.tsx"),
    route("team-dashboard/task/:id", "routes/team-dashboard.task.$id.tsx"),
    route("team-dashboard/project/:id", "routes/team-dashboard.project.$id.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
    route("projects", "routes/projects.tsx"),
    route("projects/new", "routes/projects.new.tsx"),
    route("projects/:id", "routes/projects.$id.tsx"),
    route("templates", "routes/templates.tsx"),
    route("reports", "routes/reports.tsx"),
    route("kanban", "routes/kanban.tsx"),
] satisfies RouteConfig;

