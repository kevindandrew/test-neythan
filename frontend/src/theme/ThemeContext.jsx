import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function readStoredTheme() {
  const guardado = localStorage.getItem('chaski-theme');
  if (guardado === 'light' || guardado === 'dark') return guardado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    localStorage.setItem('chaski-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
