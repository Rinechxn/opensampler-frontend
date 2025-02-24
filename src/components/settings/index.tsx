import React from "react";

interface SettingsProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    standalone?: boolean;
}

export function Settings({ open, onOpenChange, standalone = false }: SettingsProps) {
    const menuItems = [
        { id: 'general', label: 'General' },
        { id: 'library', label: 'Library' },
        { id: 'system', label: 'System' },
        { id: 'audio', label: 'Audio' },
        { id: 'about', label: 'About' },
    ];
    
    const [activeTab, setActiveTab] = React.useState('general');

    const SettingsContent = (
        <div className="flex h-screen bg-black">
            <div className="w-48 border-r border-zinc-800">
                <div className="p-4 mb-2">
                    <h2 className="text-white text-xl font-bold tracking-tight">Settings</h2>
                </div>
                <nav className="space-y-1 p-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full px-4 py-3 text-left rounded-md transition-all duration-200 ${
                                activeTab === item.id 
                                    ? "bg-white text-black font-medium shadow-lg" 
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white hover:pl-6"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 p-8 space-y-6 bg-black text-white">
                <div className="border-b border-zinc-800 pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-white">{menuItems.find(item => item.id === activeTab)?.label}</h3>
                </div>
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white">Project Location</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-zinc-500"
                                placeholder="Enter project location..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white">Auto-save Interval (minutes)</label>
                            <input 
                                type="number"
                                min="1"
                                max="60"
                                defaultValue="5"
                                className="w-full px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-white text-white"
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'audio' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white">Sample Rate</label>
                            <input 
                                type="text"
                                defaultValue="44100"
                                className="w-full px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-white text-white"
                            />
                            <p className="text-zinc-500 text-sm mt-1">Standard sample rate for professional audio</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white">Buffer Size</label>
                            <input 
                                type="text"
                                defaultValue="512"
                                className="w-full px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-white text-white"
                            />
                            <p className="text-zinc-500 text-sm mt-1">Lower values reduce latency but increase CPU usage</p>
                        </div>
                    </div>
                )}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
                            <h3 className="text-2xl font-bold text-white mb-2">About Aika</h3>
                            <p className="text-zinc-400">Version 1.0.0</p>
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <p className="text-zinc-300">Built with love by the Aika team</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (standalone) {
        return SettingsContent;
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-black rounded-lg shadow-2xl w-[800px] h-[600px] overflow-hidden border border-zinc-800">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
                    <button 
                        onClick={() => onOpenChange?.(false)}
                        className="text-zinc-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800"
                    >
                        ✕
                    </button>
                </div>
                {SettingsContent}
            </div>
        </div>
    );
}

export default Settings;