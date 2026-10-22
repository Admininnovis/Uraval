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
    <div className="flex flex-col min-h-screen bg-[#EDE5D8] overflow-x-hidden font-sans text-[#432C20]">
      <TopNav />
      <main className={`flex-1 relative w-full pb-20 md:pb-6 z-10 ${noScroll ? 'overflow-hidden' : 'overflow-auto'} py-2.5 sm:py-3.5 md:py-4 px-2.5 sm:px-3 md:px-5`}>
        <div className={`${noPadding ? 'p-0' : ''} max-w-[1360px] mx-auto min-h-full flex flex-col`}>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
