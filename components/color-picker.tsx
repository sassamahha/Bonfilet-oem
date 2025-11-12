'use client';

import { useId } from 'react';

import type { BandColorId } from '@/config/band';

type ColorPickerOption = {
  id: BandColorId;
  label: string;
  hex: string;
  isCustom?: boolean;
};

type ColorPickerProps = {
  name: string;
  label: string;
  options: ColorPickerOption[];
  selected: BandColorId;
  onSelect: (color: BandColorId) => void;
  customHex?: string;
  onCustomChange?: (hex: string) => void;
  customLabel?: string;
};

export default function ColorPicker({
  name,
  label,
  options,
  selected,
  onSelect,
  customHex,
  onCustomChange,
  customLabel
}: ColorPickerProps) {
  const colorInputId = useId();
  const selectedOption = options.find((option) => option.id === selected);

  return (
    <fieldset>
      <legend className="block text-sm font-semibold text-slate-700">{label}</legend>
      <div className="mt-3 grid grid-cols-5 gap-3">
        {options.map((option) => {
          const isSelected = option.id === selected;
          const outlineStyle = isSelected
            ? { boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.55)' }
            : undefined;

          return (
            <button
              key={option.id}
              type="button"
              name={name}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.id)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white transition"
              style={outlineStyle}
            >
              <span className="sr-only">{option.label}</span>
              {option.isCustom ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed"
                  style={{ borderColor: option.hex || '#cbd5f5' }}
                  aria-hidden
                >
                  <span className="h-4 w-4 rounded-full border border-slate-200 bg-white" />
                </span>
              ) : (
                <span
                  className="h-8 w-8 rounded-full border border-slate-200"
                  style={{ backgroundColor: option.hex }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
      {selectedOption?.isCustom && onCustomChange ? (
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-500" htmlFor={colorInputId}>
            {customLabel ?? 'Custom color'}
          </label>
          <input
            id={colorInputId}
            type="color"
            value={customHex}
            onChange={(event) => onCustomChange(event.target.value)}
            className="mt-1 h-10 w-full rounded border border-slate-300"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
