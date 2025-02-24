import Header from "@/components/sphui/header"
import LayoutRoot from "@/components/sphui/layout"
// import PianoKeyboard from "@/components/sphui/piano"
import { preloadFonts } from "../utils/preloadfont";
import { useEffect } from "react";
function App() {

  useEffect(() => {
    preloadFonts();
  }, []);

  return (
    <>
      <div className="h-screen w-screen flex flex-col">
        <Header />
        <div className="h-full w-full">
          <LayoutRoot />
          {/* <PianoKeyboard /> */}
        </div>
      </div>
    </>
  )
}

export default App
