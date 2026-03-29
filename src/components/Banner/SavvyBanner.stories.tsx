import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SavvyBanner from "./SavvyBanner";

const meta = {
  title: "Components/Banner/SavvyBanner",
  component: SavvyBanner,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
} satisfies Meta<typeof SavvyBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Resumen de tus finanzas",
    subtitle:
      "Consulta el estado de tus cuentas y el progreso de tus objetivos.",
  },
};

export const SoloTitulo: Story = {
  args: {
    title: "Bienvenido a Savvi",
  },
};
