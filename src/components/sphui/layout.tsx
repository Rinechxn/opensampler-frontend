import AreaScr from "./area";
import RackView from "../rack";
import DrumMachine from "../drum-machine";
import { useViewContext } from "../../contexts/ViewContext";

function LayoutRoot() {
    const { isRackView, isDrumMachine } = useViewContext();

    return (
        <div className="bg-zinc-800 h-full w-full flex items-center justify-between text-zinc-400 border-b border-zinc-800 p-1">
            {isDrumMachine ? (
                <DrumMachine />
            ) : isRackView ? (
                <RackView />
            ) : (
                <AreaScr />
            )}
        </div>
    );
}

export default LayoutRoot;