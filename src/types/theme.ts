export type ThemeId = 'obsidian' | 'solar' | 'oceanic' | 'cyber' | 'amethyst' | 'light';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  previewBg: string;
  previewBorder: string;
  iconName: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian SCADA',
    subtitle: 'Classic Deep Slate & Emerald Grid',
    badge: 'DEFAULT',
    accentColor: '#10b981',
    previewBg: '#090d16',
    previewBorder: '#1e293b',
    iconName: 'Zap',
  },
  {
    id: 'solar',
    name: 'Solar Amber',
    subtitle: 'Golden Sun & High-Noon Irradiance',
    badge: 'SOLAR PV',
    accentColor: '#f59e0b',
    previewBg: '#130e06',
    previewBorder: '#3d2f1b',
    iconName: 'Sun',
  },
  {
    id: 'oceanic',
    name: 'Oceanic Wind',
    subtitle: 'Deep Sapphire & Electric Cyan Breeze',
    badge: 'OFFSHORE',
    accentColor: '#38bdf8',
    previewBg: '#081226',
    previewBorder: '#173260',
    iconName: 'Wind',
  },
  {
    id: 'cyber',
    name: 'Cyber Matrix',
    subtitle: 'Pure Black & Radioactive Neon Telemetry',
    badge: 'NEON GRID',
    accentColor: '#00ff66',
    previewBg: '#000000',
    previewBorder: '#0d3817',
    iconName: 'Cpu',
  },
  {
    id: 'amethyst',
    name: 'Quantum Violet',
    subtitle: 'Deep Nebula & High-Voltage Ultraviolet',
    badge: 'QUANTUM',
    accentColor: '#c084fc',
    previewBg: '#120822',
    previewBorder: '#35175f',
    iconName: 'Sparkles',
  },
  {
    id: 'light',
    name: 'Daylight Shift',
    subtitle: 'Clean High-Contrast White & Crisp Slate',
    badge: 'DAYLIGHT',
    accentColor: '#059669',
    previewBg: '#ffffff',
    previewBorder: '#cbd5e1',
    iconName: 'SunMedium',
  },
];
