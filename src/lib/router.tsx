import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RouterCtx { path: string; navigate: (to: string) => void; }
const Ctx = createContext<RouterCtx>({} as RouterCtx);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (to: string) => { window.history.pushState({}, '', to); setPath(to); };
  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>;
}
export function useRoute() { return useContext(Ctx).path; }
export function navigate(to: string) { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }

export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return <a href={to} onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); onClick?.(); }} className={className}>{children}</a>;
}
