"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export function BarcodeScanner({
  onDetected,
  className = "btn-secondary",
}: {
  onDetected: (barcode: string) => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    let stop: (() => void) | undefined;

    async function start() {
      try {
        const { BarcodeFormat, BrowserMultiFormatReader } =
          await import("@zxing/browser");
        if (!videoRef.current || !active) return;
        const reader = new BrowserMultiFormatReader();
        reader.possibleFormats = [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.ITF,
        ];
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (!result || !active) return;
            active = false;
            controls.stop();
            setOpen(false);
            onDetected(result.getText().replace(/\D/g, ""));
          },
        );
        stop = () => controls.stop();
      } catch {
        if (active)
          setError(
            "Não foi possível acessar a câmera. Verifique a permissão do navegador.",
          );
      }
    }
    void start();
    return () => {
      active = false;
      stop?.();
    };
  }, [open, onDetected]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Camera size={17} />
        Escanear código
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-xl p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">
                  Escanear código de barras
                </h2>
                <p className="text-sm text-zinc-500">
                  Aponte a câmera para o código do produto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-zinc-100"
              >
                <X />
              </button>
            </div>
            <video
              ref={videoRef}
              className="aspect-video w-full rounded-xl bg-zinc-950 object-cover"
              muted
              playsInline
            />
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Também é possível usar leitor USB ou Bluetooth: posicione o cursor
              no campo de código e faça a leitura.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
