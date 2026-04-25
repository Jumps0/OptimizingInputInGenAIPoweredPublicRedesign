import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type NavigationGuardContextType = {
  isGuardEnabled: boolean;
  setGuardEnabled: (enabled: boolean) => void;
  confirmOrRun: (action: () => void) => void;
};

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined);

export const NavigationGuardProvider = ({ children }: { children: ReactNode }) => {
  const [isGuardEnabled, setGuardEnabled] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const isGuardEnabledRef = useRef(isGuardEnabled);

  useEffect(() => {
    isGuardEnabledRef.current = isGuardEnabled;
  }, [isGuardEnabled]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPendingAction(null);
  }, []);

  const runExit = useCallback(() => {
    const actionToRun = pendingAction;
    setIsDialogOpen(false);
    setPendingAction(null);
    setGuardEnabled(false);
    actionToRun?.();
  }, [pendingAction]);

  const confirmOrRun = useCallback(
    (action: () => void) => {
      if (!isGuardEnabledRef.current) {
        action();
        return;
      }

      setPendingAction(() => action);
      setIsDialogOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!isGuardEnabled) {
      return;
    }

    // Keep one synthetic history entry so browser/phone back can be intercepted.
    window.history.pushState({ __editGuard: true }, "", window.location.href);

    const onPopState = () => {
      if (!isGuardEnabledRef.current) {
        return;
      }

      setPendingAction(() => () => {
        setGuardEnabled(false);
        window.history.back();
      });
      setIsDialogOpen(true);
      window.history.pushState({ __editGuard: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [isGuardEnabled]);

  const contextValue = useMemo(
    () => ({
      isGuardEnabled,
      setGuardEnabled,
      confirmOrRun,
    }),
    [confirmOrRun, isGuardEnabled]
  );

  return (
    <NavigationGuardContext.Provider value={contextValue}>
      {children}

      {isDialogOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <p className="text-base font-semibold text-gray-900">Exit current edit? All progress will be lost.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={runExit}
                className="rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NavigationGuardContext.Provider>
  );
};

export const useNavigationGuard = () => {
  const context = useContext(NavigationGuardContext);
  if (context === undefined) {
    throw new Error("useNavigationGuard must be used within a NavigationGuardProvider");
  }
  return context;
};
