import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SavvyBannerHome from "./SavvyBannerHome";

const meta = {
  title: "Components/Banner/SavvyBannerHome",
  component: SavvyBannerHome,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
} satisfies Meta<typeof SavvyBannerHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Tu panel financiero",
    subtitle:
      "Balance, ingresos y actividad reciente en un solo vistazo.",
  },
};

export const SoloTitulo: Story = {
  args: {
    title: "Bienvenido a Savvi",
  },
};
