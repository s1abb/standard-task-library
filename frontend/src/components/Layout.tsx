import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Standard Task Library</h1>
            <p className="text-xs text-slate-500">Pump maintenance task register</p>
          </div>
          <nav className="flex gap-2">
            <NavLink to="/" end className={linkClass}>
              Task Register
            </NavLink>
            <NavLink to="/tasks/new" className={linkClass}>
              New Task
            </NavLink>
            <NavLink to="/lists" className={linkClass}>
              Controlled Lists
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
