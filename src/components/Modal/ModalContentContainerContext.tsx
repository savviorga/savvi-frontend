"use client";

import { createContext, useContext } from "react";

/**
 * Nodo del panel del Dialog (Modal). El Popover del datepicker debe
 * portalizarse aquí para seguir dentro del dismissable layer y recibir clics.
 */
export const ModalContentContainerContext =
  createContext<HTMLElement | null>(null);

export function useModalContentContainer() {
  return useContext(ModalContentContainerContext);
}
