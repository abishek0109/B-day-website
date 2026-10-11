import React, { createContext, useContext } from 'react';

const BirthdayRouteContext = createContext('/');

export function BirthdayRouteProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <BirthdayRouteContext.Provider value={basePath.replace(/\/$/, '') || '/'}>
      {children}
    </BirthdayRouteContext.Provider>
  );
}

export function useBookRoute() {
  const basePath = useContext(BirthdayRouteContext);

  const toBookPath = (path = '/') => {
    if (basePath === '/') return path;
    if (path === '/') return basePath;
    return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return { basePath, toBookPath };
}
