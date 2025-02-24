import { ViewProvider } from "./contexts/ViewContext";
import Header from "./components/sphui/header";
import LayoutRoot from "./components/sphui/layout";

function App() {
  return (
    <ViewProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        <Header />
        <LayoutRoot />
      </div>
    </ViewProvider>
  );
}

export default App;
