import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Tema padrão como 'light'
      
      // Alternar entre light e dark
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme); // Ajustar atributo data-theme
      },

      // Força o tema claro
      setLightTheme: () => {
        set({ theme: 'light' });
        document.documentElement.setAttribute('data-theme', 'light');
      },

      // Força o tema escuro
      setDarkTheme: () => {
        set({ theme: 'dark' });
        document.documentElement.setAttribute('data-theme', 'dark');
      },
    }),
    {
      name: 'theme-storage', // Persistência no localStorage
      partialize: (state) => ({ theme: state.theme }), // Persistência apenas do tema
    }
  )
);
