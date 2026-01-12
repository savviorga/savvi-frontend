"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

interface FileListProps {
  files: File[] | { name: string; url: string; size: number }[];
  onRemove?: (i: number) => void;
  showDownload?: boolean;
}

export default function FileList({
  files,
  onRemove,
  showDownload = true,
}: FileListProps) {
  const downloadFile = (file: any) => {
    // Caso 1: archivo ya subido en S3 → abrir en nueva pestaña
    if (file.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
      return;
    }

    // Caso 2: archivo local (aún no subido) → descarga normal
    const blobUrl = URL.createObjectURL(
      file instanceof File ? file : file.file
    );

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(blobUrl);
  };

  const getExt = (name: string) => name.split(".").pop()?.toLowerCase() || "";

  const icons: Record<string, string> = {
    pdf: "/icons/pdf.png",
    docx: "/icons/docx.png",
    doc: "/icons/docx.png",
    xls: "/icons/xlsx.png",
    xlsx: "/icons/xlsx.png",
    zip: "/icons/zip.png",
    rar: "/icons/zip.png",
    txt: "/icons/txt.png",
    csv: "/icons/csv.png",
    ppt: "/icons/pptx.png",
    pptx: "/icons/pptx.png",
  };

  return (
    <div className="space-y-3 mt-4">
      {files.map((file: any, i: number) => {
        const ext = getExt(file.name);
        const size = ((file.size ?? 0) / 1024 / 1024).toFixed(2);

        const isImage =
          file.type?.startsWith("image/") ||
          (typeof file.url === "string" &&
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url));

        const isRemote = typeof file?.url === "string" && file.url.length > 0;

        // PREVIEW o URL directo
        const preview = isImage
          ? isRemote
            ? file.url
            : URL.createObjectURL(file)
          : null;

        const icon = isImage ? preview : icons[ext] || "/icons/default.png";
        console.log({ preview });

        return (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
          >
            {/* icon / preview */}
            <div className="flex items-center space-x-4">
              {isImage ? (
                <img
                  src={icon}
                  className="w-14 h-14 object-cover rounded-lg border"
                />
              ) : (
                <img src={icon} className="w-12 h-12 object-contain" />
              )}

              {/* Info */}
              <div className="flex flex-col">
                <p className="font-medium text-gray-900 truncate max-w-[300px]">
                  {file.name}
                </p>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">{size} MB</span>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">
                    {ext.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              {showDownload && (
                <>
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    title="Descargar Documento"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-blue-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-9 0V3m0 13.5l-4.5-4.5m4.5 4.5l4.5-4.5"
                      />
                    </svg>
                  </button>
                </>
              )}

              {onRemove && (
                <button
                  onClick={() => onRemove(i)}
                  className="p-2 hover:bg-red-100 rounded-lg transition cursor-pointer"
                  title="Eliminar Documento"
                >
                  <XMarkIcon className="w-5 h-5 text-red-600" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
