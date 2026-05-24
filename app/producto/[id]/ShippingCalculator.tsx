"use client";

import { useState } from "react";

type ShippingResult = { cost: string; days: string; free: boolean };

export default function ShippingCalculator() {
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<ShippingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    const trimmed = postalCode.trim();
    if (trimmed.length !== 4 || isNaN(Number(trimmed))) {
      setError("Ingresá un código postal válido (4 dígitos).");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 700));
    const code = parseInt(trimmed);
    if (code >= 1000 && code <= 1999) {
      setResult({ cost: "GRATIS", days: "24–48 hs hábiles", free: true });
    } else if (code >= 2000 && code <= 5999) {
      setResult({ cost: "$2.500", days: "2–4 días hábiles", free: false });
    } else {
      setResult({ cost: "$4.800", days: "4–7 días hábiles", free: false });
    }
    setLoading(false);
  }

  return (
    <div className="border-2 border-charcoal p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-outline pb-3">
        <span className="material-symbols-outlined text-primary-container text-xl">
          local_shipping
        </span>
        <span className="font-black uppercase text-sm text-on-surface tracking-wide">
          Calcular envío
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={postalCode}
          onChange={(e) => {
            setPostalCode(e.target.value.replace(/\D/g, ""));
            if (result) setResult(null);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") calculate();
          }}
          placeholder="Código postal"
          className="flex-1 border-2 border-primary-container px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-accent-red bg-surface-container-lowest text-on-surface placeholder:text-outline"
        />
        <button
          onClick={calculate}
          disabled={loading || postalCode.length !== 4}
          className="bg-primary-container text-on-primary px-5 py-2.5 font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-opacity"
        >
          {loading ? "..." : "Calcular"}
        </button>
      </div>
      {error && <p className="text-accent-red text-xs font-semibold">{error}</p>}
      {result && (
        <div className="flex items-center justify-between border-l-4 border-accent-red bg-surface-container px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-on-surface-variant font-medium">Tiempo estimado</span>
            <span className="text-xs font-black uppercase text-on-surface">{result.days}</span>
          </div>
          <span
            className={`font-black text-lg ${result.free ? "text-primary-container" : "text-accent-red"}`}
          >
            {result.cost}
          </span>
        </div>
      )}
    </div>
  );
}
