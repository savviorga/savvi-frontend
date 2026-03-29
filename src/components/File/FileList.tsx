"use client";

import FileRow from "./File";

export type FileListItem =
  | File
  | {
      name: string;
      url: string;
      size: number;
      type?: string;
      file?: File;
    };

interface FileListProps {
  files: FileListItem[];
  onRemove?: (i: number) => void;
  showDownload?: boolean;
}

export default function FileList({
  files,
  onRemove,
  showDownload = true,
}: FileListProps) {
  return (
    <div className="mt-4 space-y-3">
      {files.map((item, i) => {
        const key = `${item.name}-${i}-${item.size ?? 0}`;
        const remove = onRemove ? () => onRemove(i) : undefined;

        if (item instanceof File) {
          return (
            <FileRow
              key={key}
              name={item.name}
              size={item.size}
              file={item}
              type={item.type}
              onRemove={remove}
              showDownload={showDownload}
            />
          );
        }

        return (
          <FileRow
            key={key}
            name={item.name}
            size={item.size}
            url={item.url}
            file={item.file}
            type={item.type}
            onRemove={remove}
            showDownload={showDownload}
          />
        );
      })}
    </div>
  );
}
