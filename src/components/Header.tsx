import React from 'react';
import { Swords, Calculator, Database, Sun, Moon } from 'lucide-react';
import { ALL_CHARACTERS } from '../data/characters';
import { CharacterId } from '../types';
import { useTheme } from '../context/themeCore';

interface HeaderProps {
  activeTab: 'calculator' | 'framedata';
  setActiveTab: (tab: 'calculator' | 'framedata') => void;
  selectedCharacterId: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCharacterId,
  onSelectCharacter,
}) => {
  const currentCharacter = ALL_CHARACTERS.find(c => c.id === selectedCharacterId) || ALL_CHARACTERS[0];
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0c0e17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Logo & Nav Tabs */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-indigo-600 p-[2px] flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 dark:bg-[#0d0f19] rounded-[9px] flex items-center justify-center">
                <Swords className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <span className="font-extrabold tracking-wider text-sm sm:text-base font-display text-slate-900 dark:text-white hidden min-[540px]:inline">
              SF6 OKI MASTER
            </span>
          </div>

          {/* Navigation Tabs (Merged into Top Header) */}
          <nav className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>压身计算</span>
            </button>

            <button
              onClick={() => setActiveTab('framedata')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'framedata'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>帧数速查</span>
            </button>
          </nav>
        </div>

        {/* Right: Character Picker, Dash Tag & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Character Picker Dropdown */}
          <div className="relative w-36 sm:w-44 lg:w-52">
            <select
              value={selectedCharacterId}
              onChange={(e) => onSelectCharacter(e.target.value as CharacterId)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl py-1.5 px-3 pr-7 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 shadow-inner truncate"
            >
              <optgroup label="官方本体 18人 (Base)">
                {ALL_CHARACTERS.slice(0, 18).map((char) => (
                  <option key={char.id} value={char.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white py-1">
                    {char.nameZh} ({char.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Year 1 DLC">
                {ALL_CHARACTERS.slice(18, 22).map((char) => (
                  <option key={char.id} value={char.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white py-1">
                    {char.nameZh} ({char.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Year 2 DLC">
                {ALL_CHARACTERS.slice(22, 26).map((char) => (
                  <option key={char.id} value={char.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white py-1">
                    {char.nameZh} ({char.name})
                  </option>
                ))}
              </optgroup>
              {ALL_CHARACTERS.length > 26 && (
                <optgroup label="Year 3 DLC">
                  {ALL_CHARACTERS.slice(26, 30).map((char) => (
                    <option key={char.id} value={char.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white py-1">
                      {char.nameZh} ({char.name})
                    </option>
                  ))}
                </optgroup>
              )}
              {ALL_CHARACTERS.length > 30 && (
                <optgroup label="Year 4 DLC">
                  {ALL_CHARACTERS.slice(30).map((char) => (
                    <option key={char.id} value={char.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white py-1">
                      {char.nameZh} ({char.name})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>前冲: <strong className="text-slate-900 dark:text-white">{currentCharacter.dashFrames}f</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>后撤: <strong className="text-slate-900 dark:text-white">{currentCharacter.backdashFrames}f</strong></span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm shrink-0"
            title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">浅色</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">深色</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
