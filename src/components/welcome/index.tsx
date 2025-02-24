import { SearchIcon, KeyboardMusicIcon } from "lucide-react";
function WelcomeScreen() {
    return (
        <>
            <div className="flex flex-col items-center  h-full w-full">
                <div className="flex flex-col items-center justify-center w-full pt-3">
                    <div className="relative w-full">
                        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search..." className="p-2 pl-8 bg-zinc-800 w-full outline-none" />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    {['instruments', 'drumkit', 'soundfont', 'hybrid', 'synth'].map((tab) => (
                        <button
                            key={tab}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-zinc-700 rounded-full"
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex w-full mt-4 bg-zinc-800 p-2 items-center space-x-3">
                    <KeyboardMusicIcon className="text-white" size={32} />
                    <div>
                        <h1 className="text-sm font-semibold text-white">Open-Source Sample Instrument Platform</h1>
                        <div className="flex items-center space-x-2">
                            <p className="text-gray-400 text-sm">Discover, create, and share high-quality musical instruments</p>
                            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                                Learn more →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default WelcomeScreen;