import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext.tsx";

export default function Toast() {
  const { state, dispatch } = useContext(AppContext);
  const { toast } = state;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: "HIDE_TOAST" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-pop-in">
      <div className="flex items-center gap-3">
        {toast.icon && (
          <span className="text-xl animate-bounce-subtle">{toast.icon}</span>
        )}
        <p className="font-semibold">{toast.message}</p>
      </div>
    </div>
  );
}
