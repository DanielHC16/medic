"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { extractInviteCodeFromText } from "@/lib/invite-links";

type InviteScannerProps = {
  onCodeDetected: (code: string) => void;
};

export function InviteScanner({ onCodeDetected }: InviteScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }

      streamRef.current = null;
    }

    setIsScanning(false);
  }, []);

  const decodeCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!context) {
        setMessage("Unable to read camera frames on this device.");
        return false;
      }

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (!result?.data) {
        return false;
      }

      const inviteCode = extractInviteCodeFromText(result.data);

      if (!inviteCode) {
        setMessage("QR detected, but it did not contain a MEDIC invite.");
        return false;
      }

      onCodeDetected(inviteCode);
      setMessage(`Invite ${inviteCode} detected.`);
      stopScanner();
      return true;
    },
    [onCodeDetected, stopScanner],
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (decodeCanvas(canvas)) {
          return;
        }
      }
    }

    frameRef.current = requestAnimationFrame(scanFrame);
  }, [decodeCanvas]);

  async function startScanner() {
    setMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera scanning is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setMessage("Camera permission was denied or unavailable.");
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !canvasRef.current) {
      return;
    }

    setMessage(null);

    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to decode the uploaded image.");
      }

      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      context.drawImage(imageBitmap, 0, 0);

      if (!decodeCanvas(canvas)) {
        setMessage("No MEDIC invite QR was found in that image.");
      }
    } catch {
      setMessage("Unable to scan the uploaded image.");
    } finally {
      event.currentTarget.value = "";
    }
  }

  useEffect(() => stopScanner, [stopScanner]);

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Scan invite QR</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Use the device camera or upload a screenshot of the QR code to fill the
            invite automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isScanning ? (
            <button
              type="button"
              onClick={startScanner}
              className="medic-button medic-button-primary"
            >
              Start camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="medic-button medic-button-soft"
            >
              Stop camera
            </button>
          )}

          <label className="medic-button cursor-pointer">
            Upload QR image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-black/90">
        <video
          ref={videoRef}
          muted
          playsInline
          className="min-h-[220px] w-full object-cover"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {message ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{message}</p>
      ) : null}
    </section>
  );
}
