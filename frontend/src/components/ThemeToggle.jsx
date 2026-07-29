import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const esOscuro = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={esOscuro}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        esOscuro ? 'bg-slate-600' : 'bg-slate-300'
      } ${className}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
          esOscuro ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      >
        {esOscuro ? (
          <Moon size={12} className="text-slate-700" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
