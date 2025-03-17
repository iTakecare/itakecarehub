
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function Layout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {isMobile ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="fixed top-4 left-4 z-50 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
            
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="p-0 w-[280px] max-w-[80vw]">
                <Sidebar className="h-full w-full border-none" />
              </SheetContent>
            </Sheet>
            
            <main className="flex-1 overflow-auto pt-16 px-4 pb-20 md:p-6">
              <Outlet />
            </main>
          </>
        ) : (
          <>
            <Sidebar />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
