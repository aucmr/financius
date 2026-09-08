"use client";

import { Notyf } from "notyf";

let notyfInstance: Notyf | null = null;

export function getNotyf() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!notyfInstance) {
    notyfInstance = new Notyf({
      duration: 5000,
      position: { x: "right", y: "top" },
      dismissible: true,
    });
  }

  return notyfInstance;
}
