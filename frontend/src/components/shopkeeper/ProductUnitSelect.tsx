import { useMemo, useState } from "react";
import { ChevronDown, Ruler } from "lucide-react";

interface ProductUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface UnitOption {
  value: string;
  label: string;
  symbol: string;
  group: string;
}

const UNIT_OPTIONS: UnitOption[] = [
  { value: "pcs", label: "Piece", symbol: "pcs", group: "Count" },
  { value: "unit", label: "Unit", symbol: "unit", group: "Count" },
  { value: "box", label: "Box", symbol: "box", group: "Count" },
  { value: "pack", label: "Pack", symbol: "pack", group: "Count" },
  { value: "packet", label: "Packet", symbol: "pkt", group: "Count" },
  { value: "carton", label: "Carton", symbol: "ctn", group: "Count" },
  { value: "dozen", label: "Dozen", symbol: "doz", group: "Count" },
  { value: "pair", label: "Pair", symbol: "pair", group: "Count" },
  { value: "set", label: "Set", symbol: "set", group: "Count" },
  { value: "bag", label: "Bag", symbol: "bag", group: "Count" },
  { value: "bottle", label: "Bottle", symbol: "btl", group: "Count" },
  { value: "can", label: "Can", symbol: "can", group: "Count" },
  { value: "roll", label: "Roll", symbol: "roll", group: "Count" },

  { value: "kg", label: "Kilogram", symbol: "kg", group: "Weight" },
  { value: "g", label: "Gram", symbol: "g", group: "Weight" },
  { value: "mg", label: "Milligram", symbol: "mg", group: "Weight" },
  { value: "ton", label: "Metric Ton", symbol: "ton", group: "Weight" },

  { value: "litre", label: "Litre", symbol: "L", group: "Volume" },
  { value: "ml", label: "Millilitre", symbol: "ml", group: "Volume" },

  { value: "metre", label: "Metre", symbol: "m", group: "Length" },
  { value: "cm", label: "Centimetre", symbol: "cm", group: "Length" },
  { value: "mm", label: "Millimetre", symbol: "mm", group: "Length" },
  { value: "foot", label: "Foot", symbol: "ft", group: "Length" },
  { value: "inch", label: "Inch", symbol: "in", group: "Length" },
];

export default function ProductUnitSelect({
  value,
  onChange,
  disabled = false,
}: ProductUnitSelectProps) {
  const [customMode, setCustomMode] = useState(false);

  const normalizedValue = value.trim().toLowerCase();

  const selectedUnit = useMemo(
    () =>
      UNIT_OPTIONS.find(
        (unit) => unit.value === normalizedValue,
      ),
    [normalizedValue],
  );

  const isKnownUnit = Boolean(selectedUnit);

  const showCustom =
    customMode || (Boolean(value) && !isKnownUnit);

  function handlePresetChange(nextValue: string) {
    if (nextValue === "__custom__") {
      setCustomMode(true);

      if (isKnownUnit || !value.trim()) {
        onChange("");
      }

      return;
    }

    setCustomMode(false);
    onChange(nextValue);
  }

  function switchToCustom() {
    setCustomMode(true);
  }

  function switchToPreset() {
    setCustomMode(false);

    if (!isKnownUnit) {
      onChange("");
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Unit
      </span>

      {!showCustom ? (
        <div className="relative">
          <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <select
            value={normalizedValue}
            onChange={(event) =>
              handlePresetChange(event.target.value)
            }
            disabled={disabled}
            className="h-10 w-full appearance-none rounded-xl border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select unit</option>

            <optgroup label="Count">
              {UNIT_OPTIONS.filter(
                (unit) => unit.group === "Count",
              ).map((unit) => (
                <option
                  key={unit.value}
                  value={unit.value}
                >
                  {unit.label} ({unit.symbol})
                </option>
              ))}
            </optgroup>

            <optgroup label="Weight">
              {UNIT_OPTIONS.filter(
                (unit) => unit.group === "Weight",
              ).map((unit) => (
                <option
                  key={unit.value}
                  value={unit.value}
                >
                  {unit.label} ({unit.symbol})
                </option>
              ))}
            </optgroup>

            <optgroup label="Volume">
              {UNIT_OPTIONS.filter(
                (unit) => unit.group === "Volume",
              ).map((unit) => (
                <option
                  key={unit.value}
                  value={unit.value}
                >
                  {unit.label} ({unit.symbol})
                </option>
              ))}
            </optgroup>

            <optgroup label="Length">
              {UNIT_OPTIONS.filter(
                (unit) => unit.group === "Length",
              ).map((unit) => (
                <option
                  key={unit.value}
                  value={unit.value}
                >
                  {unit.label} ({unit.symbol})
                </option>
              ))}
            </optgroup>

            <option value="__custom__">
              Custom unit
            </option>
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Ruler className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={value}
              onChange={(event) =>
                onChange(event.target.value)
              }
              disabled={disabled}
              maxLength={30}
              placeholder="e.g. tray, bundle, dozen"
              autoComplete="off"
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={switchToPreset}
            disabled={disabled}
            className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
          >
            Choose from standard units
          </button>
        </div>
      )}

      {!showCustom && (
        <button
          type="button"
          onClick={switchToCustom}
          disabled={disabled}
          className="mt-1.5 text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
        >
          Use a custom unit
        </button>
      )}

      {selectedUnit && !showCustom && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Stored as{" "}
          <span className="font-medium text-foreground">
            {selectedUnit.symbol}
          </span>
        </p>
      )}
    </div>
  );
}