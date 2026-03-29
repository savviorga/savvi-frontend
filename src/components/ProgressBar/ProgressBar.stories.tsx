import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: { control: "text" },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    variant: {
      control: "select",
      options: ["teal", "navy", "orange", "red"],
    },
    className: { control: "text" },
  },
  args: {
    label: "Presupuesto mensual",
    value: 65,
    variant: "teal",
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Vacio: Story = {
  args: {
    value: 0,
    label: "Sin avance",
  },
};

export const Completo: Story = {
  args: {
    value: 100,
    label: "Meta alcanzada",
  },
};

export const Navy: Story = {
  args: {
    variant: "navy",
    value: 48,
    label: "Ahorro objetivo",
  },
};

export const Orange: Story = {
  args: {
    variant: "orange",
    value: 82,
    label: "Uso de categoría",
  },
};

export const Red: Story = {
  args: {
    variant: "red",
    value: 95,
    label: "Límite casi alcanzado",
  },
};
