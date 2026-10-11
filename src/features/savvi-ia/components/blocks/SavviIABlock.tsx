import type { AdvisorBlock } from "../../types/proposal.types";
import AlertBlock from "./AlertBlock";
import OptionsBlock from "./OptionsBlock";
import ShortcutsBlock from "./ShortcutsBlock";
import SimulatorBlock from "./SimulatorBlock";

/**
 * Dibuja el bloque interactivo de una burbuja. Para agregar un tipo nuevo:
 * tipo en `proposal.types`, esquema en `tools.ts`, validación en
 * `lib/ai/advisor/blocks.ts`, descripción en `utils/blocks.ts` y su componente aquí.
 */
export default function SavviIABlock({
  block,
  answer,
  disabled,
  onAnswer,
}: {
  block: AdvisorBlock;
  /** Lo que el usuario ya respondió (los bloques respondidos quedan bloqueados). */
  answer?: string;
  disabled?: boolean;
  onAnswer?: (answer: string) => void;
}) {
  switch (block.type) {
    case "options":
      return <OptionsBlock block={block} answer={answer} disabled={disabled} onAnswer={onAnswer} />;
    case "alert":
      return <AlertBlock block={block} />;
    case "simulator":
      return <SimulatorBlock block={block} answer={answer} disabled={disabled} onAnswer={onAnswer} />;
    case "shortcuts":
      return <ShortcutsBlock block={block} />;
  }
}
