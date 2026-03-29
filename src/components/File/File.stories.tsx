import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import FileRow from "./File";

const meta = {
  title: "Components/File/FileRow",
  component: FileRow,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    name: { control: "text" },
    size: { control: "number" },
    showDownload: { control: "boolean" },
    className: { control: "text" },
  },
} satisfies Meta<typeof FileRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Icono PDF / extensión (archivo local sin preview de imagen) */
export const PdfLocal: Story = {
  args: {
    name: "resumen-mayo.pdf",
    size: 524_288,
    showDownload: true,
  },
  render: (args) => (
    <FileRow
      {...args}
      file={
        new File([], args.name ?? "archivo.pdf", {
          type: "application/pdf",
        })
      }
    />
  ),
};

/** Miniatura: imagen remota */
export const ImagenRemota: Story = {
  args: {
    name: "captura.jpg",
    size: 89_120,
    url: "https://picsum.photos/seed/savvi-file/240/240",
    showDownload: true,
  },
};

export const ConEliminar: Story = {
  args: {
    name: "gastos.xlsx",
    size: 12_288,
    showDownload: true,
    onRemove: fn(),
  },
  render: (args) => (
    <FileRow
      {...args}
      file={
        new File([], args.name ?? "gastos.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      }
    />
  ),
};

export const SoloLectura: Story = {
  args: {
    name: "solo-consulta.pdf",
    size: 2_048_000,
    showDownload: true,
  },
  render: (args) => (
    <FileRow
      {...args}
      file={new File([], args.name ?? "solo-consulta.pdf", {
        type: "application/pdf",
      })}
    />
  ),
};
