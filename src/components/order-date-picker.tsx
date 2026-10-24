import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function OrderDatePicker({ value, onChange, label, disabled = false }: { value: string; onChange: (value: string) => void; label: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" className="date-cell" aria-label={label} disabled={disabled}>
        <span>{date ? format(date, "dd/MM/yyyy") : "dd/mm/aaaa"}</span><CalendarDays className="size-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} {...(date ? { defaultMonth: date } : {})} locale={ptBR} onSelect={(selected) => {
        onChange(selected ? format(selected, "yyyy-MM-dd") : ""); setOpen(false);
      }} className="pointer-events-auto p-3" />
      {value && <div className="border-t p-2"><Button variant="ghost" className="w-full" onClick={() => { onChange(""); setOpen(false); }}><X />Limpar data</Button></div>}
    </PopoverContent>
  </Popover>;
}