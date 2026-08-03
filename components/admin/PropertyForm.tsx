"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { ImageIcon, Plus, Star, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { LOCATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { saveProperty } from "@/lib/properties";
import { uploadPropertyImages } from "@/lib/upload";
import { addAudit } from "@/lib/admin";
import type { Property } from "@/lib/types";
import { CurrencyInput } from "@/components/CurrencyInput";

export const blankProperty: Omit<Property, "id"> = { title:"", slug:"", description:"", transaction:"Compra", type:PROPERTY_TYPES[0], location:LOCATIONS[0], price:0, bedrooms:0, bathrooms:0, suites:0, parking:0, area:0, images:[], featured:false, sold:false };

export function PropertyForm({ property }: { property?: Property }) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<Property, "id">>(blankProperty);
  const [files, setFiles] = useState<File[]>([]);
  const [newMain, setNewMain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!property) return setForm(blankProperty);
    const { id: _, ...data } = property;
    setForm({ ...blankProperty, ...data, suites: data.suites ?? 0 });
  }, [property]);

  function setMain(index: number) {
    setForm((current) => ({ ...current, images: [current.images[index], ...current.images.filter((_, itemIndex) => itemIndex !== index)] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.images.length && !files.length) return setNotice("Adicione pelo menos uma foto do imóvel.");
    if (form.images.length + files.length > 30) return setNotice("Cada imóvel pode ter no máximo 30 fotos.");
    setBusy(true);
    try {
      setNotice(files.length ? "Comprimindo e enviando imagens..." : "Salvando imóvel...");
      const uploaded = files.length ? await uploadPropertyImages(files, setNotice) : [];
      const images = newMain && uploaded.length ? [...uploaded, ...form.images] : [...form.images, ...uploaded];
      const data = { ...form, images, slug: form.slug || form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
      const id = await saveProperty(data, property?.id);
      await addAudit(property ? "Imóvel editado" : "Imóvel cadastrado", `${form.title} · Código ${id.slice(0,8).toUpperCase()}`);
      if (property) router.push("/admin/imoveis");
      else { setForm(blankProperty); setFiles([]); setNewMain(false); setNotice("Imóvel cadastrado com sucesso."); }
    } catch (error) {
      setNotice(`Não foi possível salvar: ${error instanceof Error ? error.message : "erro inesperado"}`);
    } finally { setBusy(false); }
  }

  return <form className="property-form admin-panel" onSubmit={submit}>
    <div className="admin-page-head"><div className="admin-head-icon"><Plus/></div><div><span>{property ? "Edição" : "Novo cadastro"}</span><h1>{property ? "Editar imóvel" : "Cadastrar imóvel"}</h1><p>Preencha as informações e organize as fotos do anúncio.</p></div></div>
    <div className="fields">
      <label className="wide">Título<input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required placeholder="Ex.: Casa contemporânea no Lago Sul"/></label>
      <label>Transação<select value={form.transaction} onChange={(e)=>setForm({...form,transaction:e.target.value as Property["transaction"]})}><option>Compra</option><option>Locação</option></select></label>
      <label>Tipo<select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>{PROPERTY_TYPES.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label className="wide">Localização<select value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} required>{LOCATIONS.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label>Preço (R$)<CurrencyInput value={form.price} onValueChange={(price)=>setForm({...form,price})} required/></label>
      <label>Área (m²)<input type="number" min="1" value={form.area} onChange={(e)=>setForm({...form,area:+e.target.value})} required/></label>
      <label>Quartos<input type="number" min="0" value={form.bedrooms} onChange={(e)=>setForm({...form,bedrooms:+e.target.value})} required/></label>
      <label>Banheiros<input type="number" min="0" value={form.bathrooms} onChange={(e)=>setForm({...form,bathrooms:+e.target.value})} required/></label>
      <label>Suítes<input type="number" min="0" value={form.suites} onChange={(e)=>setForm({...form,suites:+e.target.value})}/></label>
      <label>Vagas<input type="number" min="0" value={form.parking} onChange={(e)=>setForm({...form,parking:+e.target.value})}/></label>
      <label className="wide">Descrição<textarea rows={6} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} required/></label>
      {form.images.length > 0 && <div className="existing-images wide"><div><ImageIcon/><b>Fotos cadastradas</b><small>A primeira foto é a capa do imóvel.</small></div><div className="image-manager">{form.images.map((image,index)=><article key={`${image}-${index}`} className={index===0?"main":""}><div><Image src={image} alt={`Foto ${index+1}`} fill sizes="150px"/></div>{index===0?<span><Star/> Principal</span>:<button type="button" onClick={()=>setMain(index)}><Star/> Tornar principal</button>}<button type="button" className="remove-image" onClick={()=>setForm({...form,images:form.images.filter((_,i)=>i!==index)})} aria-label="Remover foto"><Trash2/></button></article>)}</div></div>}
      <label className="upload wide"><Upload/><b>Adicionar imagens *</b><span>Obrigatório adicionar pelo menos uma foto e permitido no máximo 30. Elas serão comprimidas e convertidas para WebP.</span><input type="file" accept="image/*" multiple required={!form.images.length} onChange={(e)=>{const selected=Array.from(e.target.files||[]).slice(0,Math.max(0,30-form.images.length));setFiles(selected);setNotice(selected.length?`${selected.length} arquivo(s) selecionado(s).`:"");}}/>{files.length>0&&<em>{files.length} nova(s) foto(s)</em>}</label>
      {property && files.length>0 && <label className="main-new wide"><input type="checkbox" checked={newMain} onChange={(e)=>setNewMain(e.target.checked)}/> Usar a primeira nova imagem como foto principal</label>}
    </div>
    <div className="form-actions"><button className="admin-btn" disabled={busy}>{busy?"Processando...":property?"Salvar alterações":"Cadastrar imóvel"}</button></div>
    {notice&&<p className="notice">{notice}</p>}
  </form>;
}
