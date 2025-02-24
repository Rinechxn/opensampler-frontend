import React, { createContext, useContext, useState } from 'react';

interface ViewContextType {
    isRackView: boolean;
    isDrumMachine: boolean;
    setIsRackView: (value: boolean) => void;
    setIsDrumMachine: (value: boolean) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const [isRackView, setIsRackView] = useState(true);
    const [isDrumMachine, setIsDrumMachine] = useState(false);

    return (
        <ViewContext.Provider value={{ 
            isRackView, 
            isDrumMachine,
            setIsRackView,
            setIsDrumMachine 
        }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useViewContext() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error('useViewContext must be used within a ViewProvider');
    }
    return context;
}
