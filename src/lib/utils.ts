// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Esta función es el corazón de Shadcn: permite mezclar clases de Tailwind sin que choquen
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}