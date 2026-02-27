import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        accent: 'hsl(var(--accent))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(186, 164, 126, 0.25), 0 20px 60px rgba(7, 10, 19, 0.35)',
      },
      backgroundImage: {
        'mesh-gold': 'radial-gradient(circle at 15% 15%, rgba(186,164,126,0.2), transparent 48%), radial-gradient(circle at 85% 10%, rgba(81,126,184,0.18), transparent 45%), radial-gradient(circle at 50% 90%, rgba(180,102,71,0.16), transparent 42%)',
      },
    },
  },
  plugins: [],
};

export default config;
