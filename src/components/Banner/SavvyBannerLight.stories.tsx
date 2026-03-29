import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SavvyBannerLight from "./SavvyBannerLight";

const meta = {
  title: "Components/Banner/SavvyBannerLight",
  component: SavvyBannerLight,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
} satisfies Meta<typeof SavvyBannerLight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Nueva categoría",
    subtitle: "Completa los datos para crear la categoría.",
  },
};

export const SoloTitulo: Story = {
  args: {
    title: "Registrar pago",
  },
};
