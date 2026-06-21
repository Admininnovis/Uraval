import React from 'react';
import TopNav from './TopNav';
import MobileNav from './MobileNav';
import {
  BananaTree, VillageHouse, TempleGopuram, CoconutTree,
  KolamPattern, PalmLeafManuscript, BullockCart, EarthenPot,
  CornerMark
} from './Illustrations';

const Layout = ({ children, noPadding = false, noScroll = false }) => {
  return (
    <div className="flex flex-col min-h-screen bg-ledger-aged overflow-hidden font-serif">
      <div className="fixed inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>

      {/* Global Background Illustrations (Watermarks) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04] text-ledger-brown">
        {/* Top Left */}
        <div className="absolute -top-10 -left-10 w-64 h-64 transform -rotate-12"><KolamPattern className="w-full h-full" /></div>
        <div className="absolute top-20 left-10 w-40 h-20 transform rotate-6"><PalmLeafManuscript className="w-full h-full" /></div>

        {/* Top Right */}
        <div className="absolute top-10 -right-20 w-80 h-80"><BananaTree className="w-full h-full" /></div>
        <div className="absolute top-48 right-10 w-32 h-32"><VillageHouse className="w-full h-full" /></div>

        {/* Bottom Left */}
        <div className="absolute -bottom-10 -left-10 w-80 h-80"><TempleGopuram className="w-full h-full" /></div>
        <div className="absolute bottom-40 left-10 w-48 h-48"><CoconutTree className="w-full h-full" /></div>

        {/* Bottom Right */}
        <div className="absolute bottom-10 right-10 w-64 h-64"><BullockCart className="w-full h-full" /></div>
        <div className="absolute bottom-10 right-64 w-32 h-32"><EarthenPot className="w-full h-full" /></div>

        {/* Page Corner Marks */}
        <div className="absolute top-24 left-4 w-8 h-8"><CornerMark className="w-full h-full" /></div>
        <div className="absolute top-24 right-4 w-8 h-8 transform rotate-90"><CornerMark className="w-full h-full" /></div>
        <div className="absolute bottom-20 left-4 w-8 h-8 transform -rotate-90"><CornerMark className="w-full h-full" /></div>
        <div className="absolute bottom-20 right-4 w-8 h-8 transform rotate-180"><CornerMark className="w-full h-full" /></div>
      </div>

      <TopNav />
      <main className={`flex-1 relative w-full pb-20 md:pb-0 z-10 ${noScroll ? 'overflow-hidden' : 'overflow-auto'}`}>
        <div className={`${noPadding ? 'p-0' : 'p-4 md:p-8 lg:p-10'} max-w-7xl mx-auto min-h-full flex flex-col`}>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
