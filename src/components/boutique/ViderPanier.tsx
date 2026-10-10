"use client";
import { useEffect } from "react";
import { usePanier } from "./Panier";

export default function ViderPanier() {
  const { vider, nombre } = usePanier();
  useEffect(() => { if (nombre) vider(); }, [nombre, vider]);
  return null;
}
