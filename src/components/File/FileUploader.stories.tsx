import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import FileList from "./FileList";
import FileUploader from "./FileUploader";

const meta = {
  title: "Components/File/FileUploader",
  component: FileUploader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: { control: "text" },
    maxFiles: { control: { type: "number", min: 1, max: 20 } },
    maxSize: { control: { type: "number" } },
    disabled: { control: "boolean" },
    className: { control: "text" },
  },
  args: {
    label: "Arrastra archivos o haz clic para seleccionar",
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    disabled: false,
    onFilesChange: fn(),
  },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Deshabilitado: Story = {
  args: {
    disabled: true,
  },
};

/** Sube archivos y los muestra con FileList (mismo flujo que TransactionModal) */
export const ConLista: Story = {
  render: function ConListaRender(args) {
    const [files, setFiles] = useState<File[]>([]);
    const onFilesChange = useCallback(
      (next: File[]) => {
        args.onFilesChange?.(next);
        setFiles((prev) => [...prev, ...next]);
      },
      [args]
    );

    return (
      <div className="max-w-lg space-y-2">
        <FileUploader
          {...args}
          onFilesChange={onFilesChange}
        />
        {files.length > 0 && (
          <FileList
            files={files}
            onRemove={(i) =>
              setFiles((current) => current.filter((_, j) => j !== i))
            }
          />
        )}
      </div>
    );
  },
  args: {
    label: "PDF, imágenes o documentos Office",
    maxFiles: 5,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  },
};
