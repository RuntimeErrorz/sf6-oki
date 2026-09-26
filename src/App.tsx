import React, { useState } from 'react';
import { CharacterId } from './types';
import { ALL_CHARACTERS, CHARACTER_MAP } from './data/characters';
import { Header } from './components/Header';
import { OkiCalculator } from './components/calculator/OkiCalculator';
import { FrameDataExplorer } from './components/framedata/FrameDataExplorer';
import { ThemeProvider } from './context/ThemeContext';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'framedata'>('calculator');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('luke');

  const currentCharacter = CHARACTER_MAP[selectedCharacterId] || ALL_CHARACTERS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08090d] text-slate-900 dark:text-slate-100 flex flex-col bg-grid-pattern selection:bg-rose-500 selection:text-white transition-colors duration-200">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCharacterId={selectedCharacterId}
        onSelectCharacter={(id) => setSelectedCharacterId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5">
        {activeTab === 'calculator' && (
          <OkiCalculator
            key={currentCharacter.id}
            character={currentCharacter}
          />
        )}

        {activeTab === 'framedata' && (
          <FrameDataExplorer
            character={currentCharacter}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a0b10] py-6 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 font-display text-sm tracking-wider">
              SF6 OKI MASTER
            </span>
            <span>· 数据与算法同步 2026 最新版本</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>数据源: FAT (Frame Assistant Tool) 权威帧数库</span>
            <span>·</span>
            <span>Designed for Competitive SF6 Players</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
