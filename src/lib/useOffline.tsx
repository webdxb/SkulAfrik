import { useEffect, useState } from 'react';

interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  setWasOffline: (v: boolean) => void;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setWasOffline(true); };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOnline, wasOffline, setWasOffline };
}

export function OfflineBanner() {
  const { isOnline, wasOffline, setWasOffline } = useOffline();
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBack(true);
      const t = setTimeout(() => { setShowBack(false); setWasOffline(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline, setWasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white text-center text-sm font-medium py-1.5 px-4 shadow-md">
        Mode hors ligne — certaines données peuvent ne pas être à jour
      </div>
    );
  }
  if (showBack) {
    return (
      <div className="fixed top-0 inset-x-0 z-[60] bg-emerald-600 text-white text-center text-sm font-medium py-1.5 px-4 shadow-md transition-opacity">
        Connexion rétablie
      </div>
    );
  }
  return null;
}
