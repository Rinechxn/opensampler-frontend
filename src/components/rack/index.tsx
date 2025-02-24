// import { SearchIcon, KeyboardMusicIcon } from "lucide-react";
function RackView() {
    return (
        <>
            <div className="flex flex-col items-center h-full w-full bg-black border border-zinc-700">
                <div className="h-8 bg-zinc-900 w-full flex items-center justify-between">
                    <div className="flex items-center h-full px-4 text-sm">
                        <p className="text-white">Multi-rack</p>
                        <select name="" id="">
                            <option value="1">Rack 1</option>
                            <option value="2">Rack 2</option>
                            <option value="3">Rack 3</option>
                            <option value="4">Rack 4</option>
                        </select>
                    </div>
                    <div className="text-sm">
                        <button className="text-white px-2 py-2 text-xs hover:bg-white/40 duration-100">1-16</button>
                        <button className="text-white px-2 py-2 text-xs hover:bg-white/40 duration-100">17-32</button>
                        <button className="text-white px-2 py-2 text-xs hover:bg-white/40 duration-100">33-48</button>
                        <button className="text-white px-2 py-2 text-xs hover:bg-white/40 duration-100">49-64</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RackView;