"use client";

interface CurrencyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
}

const formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function CurrencyInput({ value, onValueChange, name, placeholder = "R$ 0", required = false }: CurrencyInputProps) {
  const displayValue = value > 0 ? `R$ ${formatter.format(value)}` : "";

  return <>
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      placeholder={placeholder}
      required={required}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        onValueChange(digits ? Number(digits) : 0);
      }}
    />
    {name && <input type="hidden" name={name} value={value > 0 ? String(value) : ""}/>} 
  </>;
}
