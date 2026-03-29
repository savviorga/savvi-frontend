import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import CustomTable, { type Column } from "./CustomTable";

type DemoRow = {
  id: string;
  producto: string;
  monto: string;
  estado: string;
};

const columnas: Column<DemoRow>[] = [
  {
    key: "producto",
    header: "Producto",
    render: (r) => r.producto,
  },
  {
    key: "monto",
    header: "Monto",
    className: "tabular-nums",
    render: (r) => r.monto,
  },
  {
    key: "estado",
    header: "Estado",
    render: (r) => (
      <span className="inline-flex rounded-full bg-mint/12 px-2.5 py-0.5 text-xs font-medium text-mint">
        {r.estado}
      </span>
    ),
  },
];

const filas: DemoRow[] = [
  {
    id: "1",
    producto: "Suscripción anual",
    monto: "$1,200.00",
    estado: "Pagado",
  },
  {
    id: "2",
    producto: "Hosting",
    monto: "$450.00",
    estado: "Pendiente",
  },
  {
    id: "3",
    producto: "Dominio .com",
    monto: "$180.00",
    estado: "Pagado",
  },
];

const meta = {
  title: "Components/Table/CustomTable",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ConDatos: Story = {
  render: () => (
    <CustomTable<DemoRow>
      data={filas}
      columns={columnas}
      rowKey={(r) => r.id}
    />
  ),
};

export const Vacia: Story = {
  render: () => (
    <CustomTable<DemoRow>
      data={[]}
      columns={columnas}
      rowKey={(r) => r.id}
    />
  ),
};

export const Cargando: Story = {
  render: () => (
    <CustomTable<DemoRow>
      data={[]}
      columns={columnas}
      rowKey={(r) => r.id}
      loading
    />
  ),
};

export const ConPaginacion: Story = {
  render: () => (
    <CustomTable<DemoRow>
      data={filas}
      columns={columnas}
      rowKey={(r) => r.id}
      totalPages={5}
      onPageChange={fn()}
    />
  ),
};
