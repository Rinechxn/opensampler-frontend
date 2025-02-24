import Logo from "../../assets/logo.svg";
import { Cpu, MemoryStick, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
    MenubarMenu,
    MenubarContent,
    MenubarItem,
    MenubarShortcut,
    MenubarTrigger,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    Menubar,
} from "@/components/ui/menubar";
import { menuItems } from "@/data/menu";
import { useViewContext } from "../../contexts/ViewContext";
import { useState } from "react";
import { Settings } from "@/components/settings";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

declare global {
    interface Window {
        electronAPI: {
            openFile: (options: { filters: { name: string, extensions: string[] }[] }) => Promise<string[]>;
            saveFile: (options: { filters: { name: string, extensions: string[] }[] }) => Promise<string | undefined>;
        }
    }
}

function Header() {
    const { isRackView, isDrumMachine, setIsRackView, setIsDrumMachine } = useViewContext();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleMenuAction = (item: any) => {
        if (item.title === "Settings") {
            setIsSettingsOpen(true);
            return;
        }

        // Handle file operations
        switch (item.action) {
            case 'openOSMP':
            case 'openSF2':
            case 'openXML':
            case 'openNKI':
                handleFileOpen(item.action.replace('open', '').toLowerCase());
                break;
            case 'saveOSMP':
            case 'saveSF2':
            case 'saveXML':
            case 'saveNKI':
                handleFileSave(item.action.replace('save', '').toLowerCase());
                break;
        }
    };

    const handleFileOpen = async (format: string) => {
        const filters = {
            'osmp': [{ name: 'OSMP Files', extensions: ['osmp'] }],
            'sf2': [{ name: 'SoundFont Files', extensions: ['sf2'] }],
            'xml': [{ name: 'XML Files', extensions: ['xml'] }],
            'nki': [{ name: 'Kontakt Files', extensions: ['nki'] }]
        };

        try {
            const filePaths = await window.electronAPI.openFile({
                filters: filters[format as keyof typeof filters]
            });

            if (filePaths && filePaths.length > 0) {
                console.log(`Opening ${format} file:`, filePaths[0]);
                // Handle the selected file here
            }
        } catch (error) {
            console.error('Error opening file:', error);
        }
    };

    const handleFileSave = async (format: string) => {
        const filters = {
            'osmp': [{ name: 'OSMP Files', extensions: ['osmp'] }],
            'sf2': [{ name: 'SoundFont Files', extensions: ['sf2'] }],
            'xml': [{ name: 'XML Files', extensions: ['xml'] }],
            'nki': [{ name: 'Kontakt Files', extensions: ['nki'] }]
        };

        try {
            const filePath = await window.electronAPI.saveFile({
                filters: filters[format as keyof typeof filters]
            });

            if (filePath) {
                console.log(`Saving as ${format} file:`, filePath);
                // Handle the file saving here
            }
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    return (
        <>
            <div className="bg-zinc-900 h-12 w-screen flex items-center justify-between px-4 text-zinc-400 border-b border-zinc-800">
                <div className="flex space-x-4 items-center">
                    <div 
                        className="h-8 w-32 bg-no-repeat bg-contain bg-center" 
                        style={{ backgroundImage: `url(${Logo})` }}
                        draggable="false"
                    />
                    <Menubar className="border-none bg-transparent">
                        {menuItems.map((menu) => (
                            <MenubarMenu key={menu.title}>
                                <MenubarTrigger className="text-xs uppercase font-medium">
                                    {menu.title}
                                </MenubarTrigger>
                                <MenubarContent>
                                    {menu.items.map((item, idx) => (
                                        item.type === "separator" ? (
                                            <MenubarSeparator key={idx} />
                                        ) : item.submenu ? (
                                            <MenubarSub key={item.title}>
                                                <MenubarSubTrigger>{item.title}</MenubarSubTrigger>
                                                <MenubarSubContent>
                                                    {item.submenu.map((subItem) => (
                                                        <MenubarItem key={subItem.title}>
                                                            {subItem.title}
                                                            {subItem.shortcut && (
                                                                <MenubarShortcut>{subItem.shortcut}</MenubarShortcut>
                                                            )}
                                                        </MenubarItem>
                                                    ))}
                                                </MenubarSubContent>
                                            </MenubarSub>
                                        ) : (
                                            <MenubarItem key={item.title} onClick={() => handleMenuAction(item)}>
                                                {item.title}
                                                {item.shortcut && (
                                                    <MenubarShortcut>{item.shortcut}</MenubarShortcut>
                                                )}
                                            </MenubarItem>
                                        )
                                    ))}
                                </MenubarContent>
                            </MenubarMenu>
                        ))}
                    </Menubar>
                </div>
                <div className="flex items-center space-x-4 text-xs uppercase font-medium">
                    <div className="flex space-x-3 items-center">
                        <button 
                            className={`p-1 rounded-4xl duration-100 ${isRackView ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
                            onClick={() => {
                                setIsRackView(!isRackView);
                                setIsDrumMachine(false);
                            }}
                        >
                            Rack View
                        </button>
                        <button 
                            className={`p-1 rounded-4xl duration-100 ${isDrumMachine ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
                            onClick={() => {
                                setIsDrumMachine(!isDrumMachine);
                                setIsRackView(false);
                            }}
                        >
                            Drum Machine
                        </button>
                    </div>
                    <div className="flex space-x-3 items-center">
                        <div className="flex items-center space-x-1">
                            <Cpu size={14} />
                            <span>0%</span>
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-zinc-800" />
                        <div className="flex items-center space-x-1">
                            <MemoryStick size={14} />
                            <span>0%</span>
                        </div>
                    </div>
                    <button className="flex items-center space-x-1 h-8">
                        <User size={14} />
                        <span>Account</span>
                    </button>
                </div>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[800px] sm:h-[600px]">
                    <Settings standalone />
                </DialogContent>
            </Dialog>
        </>
    );
}

export default Header;