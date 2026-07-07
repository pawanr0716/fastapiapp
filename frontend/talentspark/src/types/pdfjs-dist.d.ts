declare module "pdfjs-dist/build/pdf.mjs" {
  import type { PDFDocumentProxy, GlobalWorkerOptions } from "pdfjs-dist";
  export const GlobalWorkerOptions: typeof GlobalWorkerOptions;
  export function getDocument(src: string | Uint8Array | object): {
    promise: Promise<PDFDocumentProxy>;
  };
}

declare module "pdfjs-dist/build/pdf.worker.min.js?url" {
  const url: string;
  export default url;
}
