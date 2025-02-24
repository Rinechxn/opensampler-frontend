// import React from 'react';
import { FolderOpen, Save, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function Header() {
  const handleMenuAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('osmp-operation', {
      detail: { type: action }
    }));
  };

  return (
    <div className="flex items-center justify-between px-4 h-12 bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleMenuAction('openOSMP')}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleMenuAction('saveOSMP')}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          variant="ghost" 
          size="icon"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Header;
