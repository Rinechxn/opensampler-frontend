import WelcomeScreen from "../welcome";
function AreaScr() {
    return (
        <>
            <div className="bg-black h-full w-full flex items-center justify-between px-4 text-zinc-400 border-b border-zinc-800 p-2">
                <WelcomeScreen />
            </div>
        </>
    );
}

export default AreaScr;