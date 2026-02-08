"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // ব্রাউজারে মাউন্ট হওয়ার পর এটি বডি-র শেষে চিলড্রেন রেন্ডার করবে
  return mounted ? createPortal(children, document.body) : null;
};