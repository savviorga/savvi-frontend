import { useState } from "react";
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Modal from "./Modal";

/** Args de Storybook (el render inyecta open, onOpenChange y children) */
type ModalStoryArgs = Omit<
  ComponentProps<typeof Modal>,
  "open" | "onOpenChange" | "children"
>;

const meta = {
  title: "Components/Modal",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    hideCloseButton: { control: "boolean" },
    className: { control: "text" },
    fullScreenOnSmallViewports: { control: "boolean" },
    headerIcon: { control: false },
  },
  args: {
    title: "Título del modal",
    description: "Descripción opcional debajo del título.",
    hideCloseButton: false,
    fullScreenOnSmallViewports: true,
  },
  render: function Render(args: ModalStoryArgs) {
    const [open, setOpen] = useState(true);
    return (
      <div className="min-h-[480px] bg-slate-100/80 p-8">
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <p className="text-sm text-muted-foreground">
            Contenido del modal. Cierra con la X, Escape o clic fuera del panel.
          </p>
        </Modal>
      </div>
    );
  },
} satisfies Meta<ModalStoryArgs>;

export default meta;
type Story = StoryObj<ModalStoryArgs>;

export const Basic: Story = {};

export const SoloTitulo: Story = {
  args: {
    description: undefined,
  },
};

export const SinTitulo: Story = {
  args: {
    title: undefined,
    description: undefined,
  },
};

export const SinBotonCerrar: Story = {
  args: {
    title: "Sin botón de cierre",
    description: "Cierra con clic fuera o Escape.",
    hideCloseButton: true,
  },
};

export const ConTrigger: Story = {
  render: function Render(args: ModalStoryArgs) {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex min-h-[480px] flex-col items-center justify-start bg-slate-100/80 p-8">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => setOpen(true)}
        >
          Abrir modal
        </button>
        <Modal {...args} open={open} onOpenChange={setOpen}>
          <p className="text-sm text-muted-foreground">
            El modal se abrió desde el botón.
          </p>
        </Modal>
      </div>
    );
  },
  args: {
    title: "Modal con disparador",
    description: "Empieza cerrado; usa el botón para abrirlo.",
  },
};
