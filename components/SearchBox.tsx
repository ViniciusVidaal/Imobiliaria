"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LOCATIONS, PROPERTY_TYPES } from "@/lib/constants";

export function SearchBox() {
  const router = useRouter();
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const hasFilter = ["bedrooms", "type", "location", "max"].some((field) => String(data.get(field) || "").trim());
    if (!hasFilter) {
      setNotice("Selecione quartos, tipo, localização ou preço máximo para buscar.");
      return;
    }
    setNotice("");
    const query = new URLSearchParams();
    data.forEach((value, key) => { if (String(value).trim()) query.set(key, String(value)); });
    router.push(`/imoveis?${query.toString()}`);
  }

  return <form className="search-box" onSubmit={submit}>
    <div className="transaction"><label><input type="radio" name="transaction" value="Compra" defaultChecked/> Comprar</label><label><input type="radio" name="transaction" value="Locação"/> Alugar</label></div>
    <div className="search-grid">
      <label><span>Quartos</span><select name="bedrooms" defaultValue=""><option value="">Quantidade</option><option value="1">1 quarto</option><option value="2">2 quartos</option><option value="3">3 quartos</option><option value="4+">4 ou mais</option></select></label>
      <label><span>Tipo de imóvel</span><select name="type" defaultValue=""><option value="">Todos os tipos</option>{PROPERTY_TYPES.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label><span>Localização</span><select name="location" defaultValue=""><option value="">Todas as regiões</option>{LOCATIONS.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label><span>Preço até</span><input type="number" name="max" min="1" placeholder="Sem limite"/></label>
      <button className="btn primary"><Search/> Buscar imóveis</button>
    </div>
    {notice && <p className="search-notice" role="alert">{notice}</p>}
  </form>;
}
