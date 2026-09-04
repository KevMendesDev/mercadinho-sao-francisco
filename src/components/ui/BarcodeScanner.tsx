"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, X } from "lucide-react";
import {
  classifyCameraFailure,
  normalizeBarcode,
  PREFERRED_CAMERA_CONSTRAINTS,
  RETAIL_BARCODE_FORMATS,
  RETAIL_DECODE_HINTS,
} from "@/lib/barcode-scanner";

export function BarcodeScanner({
  onDetected,
  className = "btn-secondary",
}: {
  onDetected: (barcode: string) => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCameraRef = useRef<() => void>(() => {});
  const onDetectedRef = useRef(onDetected);
  const sessionRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [imageState, setImageState] = useState<"idle" | "analyzing" | "not-found">(
    "idle",
  );

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  function close() {
    sessionRef.current += 1;
    stopCameraRef.current();
    setOpen(false);
  }

  function detect(value: string) {
    const barcode = normalizeBarcode(value);
    if (!barcode) return;
    close();
    onDetectedRef.current(barcode);
  }

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "A câmera só funciona em uma conexão HTTPS. Selecione uma imagem para continuar.",
        );
        return;
      }
      try {
        const [browser, library] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (!videoRef.current || !active) return;

        const reader = new browser.BrowserMultiFormatReader(
          new Map([[library.DecodeHintType.TRY_HARDER, RETAIL_DECODE_HINTS.tryHarder]]),
        );
        reader.possibleFormats = RETAIL_BARCODE_FORMATS.map(
          (format) => browser.BarcodeFormat[format],
        );
        const controls = await reader.decodeFromConstraints(
          { video: PREFERRED_CAMERA_CONSTRAINTS },
          videoRef.current,
          (result) => {
            if (!result || !active) return;
            const barcode = normalizeBarcode(result.getText());
            if (!barcode) return;
            active = false;
            stopCameraRef.current();
            setOpen(false);
            onDetectedRef.current(barcode);
          },
        );
        if (!active) {
          controls.stop();
          return;
        }
        stopCameraRef.current = controls.stop;
      } catch (error) {
        if (!active) return;
        setCameraError(
          classifyCameraFailure(error) === "permission"
            ? "O acesso à câmera foi negado. Selecione uma imagem para continuar."
            : "Não foi possível acessar a câmera. Tente novamente ou selecione uma imagem.",
        );
      }
    }

    void start();
    return () => {
      active = false;
      stopCameraRef.current();
      stopCameraRef.current = () => {};
    };
  }, [open]);

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const session = sessionRef.current;
    setImageState("analyzing");
    const url = URL.createObjectURL(file);
    try {
      const [browser, library] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      const reader = new browser.BrowserMultiFormatReader(
        new Map([[library.DecodeHintType.TRY_HARDER, RETAIL_DECODE_HINTS.tryHarder]]),
      );
      reader.possibleFormats = RETAIL_BARCODE_FORMATS.map(
        (format) => browser.BarcodeFormat[format],
      );
      let result;
      try {
        result = await reader.decodeFromImageUrl(url);
      } catch {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Imagem inválida"));
          image.src = url;
        });
        const maxDimension = 3200;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas indisponível");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        result = reader.decodeFromCanvas(canvas);
      }
      if (session !== sessionRef.current) return;
      detect(result.getText());
    } catch {
      if (session === sessionRef.current) setImageState("not-found");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          sessionRef.current += 1;
          setCameraError("");
          setImageState("idle");
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
                <h2 className="text-xl font-black">Escanear código de barras</h2>
                <p className="text-sm text-zinc-500">
                  Aponte a câmera para o código ou selecione uma foto.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
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
            <label className="btn-secondary mt-3 inline-flex cursor-pointer">
              <ImageUp size={17} />
              {imageState === "analyzing" ? "Analisando imagem..." : "Usar foto"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={imageState === "analyzing"}
                onChange={(event) => void scanImage(event)}
              />
            </label>
            {cameraError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {cameraError}
              </p>
            )}
            {imageState === "not-found" && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Não encontramos um código legível. Tente outra foto ou use a câmera.
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Também é possível usar leitor USB ou Bluetooth: posicione o cursor no campo de código e faça a leitura.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
