// src/types/window.d.ts

interface Window {
  ethereum?: {
    isMetaMask?: true;
    request: (...args: any[]) => Promise<any>;
    // می‌توانید انواع دقیق‌تری را در آینده اضافه کنید
  };
}