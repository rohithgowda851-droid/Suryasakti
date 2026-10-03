import React, { useState, useRef, useEffect } from 'react';
import { Check, Palette, Sparkles, Sun, Wind, Zap, Cpu, X } from 'lucide-react';
import { THEME_OPTIONS, ThemeId, ThemeOption } from '../types/theme';

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeThemeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'solar':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'oceanic':
        return <Wind className="w-3.5 h-3.5 text-sky-400" />;
      case 'cyber':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      case 'amethyst':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-emerald-600" />;
      case 'obsidian':
      default:
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer shadow-sm"
        title="Change Visual Theme"
      >
        <Palette className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden md:inline font-mono text-[11px] text-slate-400">Theme:</span>
        <span className="font-semibold text-white flex items-center gap-1">
          {getThemeIcon(activeThemeOption.id)}
          <span>{activeThemeOption.name.split(' ')[0]}</span>
        </span>
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl z-50 p-3.5 animate-fade-in text-slate-100">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">Select SCADA Theme</h4>
                <p className="text-[10px] text-slate-400">Change control room visual appearance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {THEME_OPTIONS.map((theme: ThemeOption) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Visual Color Swatch Orb */}
                    <div
                      className="w-7 h-7 rounded-lg border flex items-center justify-center shadow-inner relative overflow-hidden"
                      style={{
                        backgroundColor: theme.previewBg,
                        borderColor: theme.previewBorder,
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{theme.name}</span>
                        <span
                          className="text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase tracking-wider"
                          style={{
                            color: theme.accentColor,
                            backgroundColor: `${theme.accentColor}20`,
                          }}
                        >
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{theme.subtitle}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Themes persist automatically</span>
            <span className="font-mono text-[10px]">SCADA v4.2</span>
          </div>
        </div>
      )}
    </div>
  );
};
