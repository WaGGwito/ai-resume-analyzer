export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// Vite-friendly dynamic loading of pdfjs and its matching worker
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then(async (lib) => {
    try {
      // Ensure the worker matches the exact installed pdfjs-dist version by importing it from the package.
      // Vite supports importing the worker via new URL(..., import.meta.url)
      // which yields the correct asset URL with cache busting.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const workerUrl = new URL("../../node_modules/pdfjs-dist/build/pdf.worker.mjs", import.meta.url);
      // Some environments allow setting workerSrc directly, others prefer workerPort via a constructed Worker.
      // Construct a dedicated Worker to avoid path issues and version mismatches.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const worker = new Worker(workerUrl, { type: "module" });
      lib.GlobalWorkerOptions.workerPort = worker;
    } catch (e) {
      // Fallback to workerSrc using package path; Vite will rewrite it to a served asset URL.
          // Some versions may not have type declarations for GlobalWorkerOptions; cast to any for runtime assignment.
      (lib as any).GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/build/pdf.worker.mjs?url").then(m => m.default);
    }

    pdfjsLib = lib;
    isLoading = false;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 3 });
    if (typeof document === 'undefined') {
      throw new Error('No DOM available to render PDF');
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      ); // Set quality to maximum (1.0)
    });
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err}`,
    };
  }
}