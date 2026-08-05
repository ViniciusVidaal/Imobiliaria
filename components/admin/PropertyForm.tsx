"use client";

import Image from "next/image";
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Save, Star, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { LOCATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { saveProperty } from "@/lib/properties";
import { deleteCloudinaryImages, uploadPropertyImages } from "@/lib/upload";
import { addAudit } from "@/lib/admin";
import type { Property } from "@/lib/types";
import { CurrencyInput } from "@/components/CurrencyInput";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const blankProperty: Omit<Property, "id"> = { title:"", slug:"", description:"", transaction:"Compra", type:PROPERTY_TYPES[0], location:LOCATIONS[0], price:0, bedrooms:0, bathrooms:0, suites:0, parking:0, area:0, images:[], featured:false, sold:false };

const TYPES_WITH_OPTIONAL_ROOMS = new Set(["terreno", "lote", "loja comercial", "fazenda", "sitio", "chacara"]);

function normalizePropertyType(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function normalizeStoredPropertyType(value: string) {
  const normalized = normalizePropertyType(value || "");
  if (["lote", "terreno"].includes(normalized)) return "Terreno";
  if (["loja", "loja comercial", "loja/ponto comercial", "sala comercial", "conjunto comercial/sala"].includes(normalized)) return "Loja comercial";
  if (["fazenda", "sitio", "fazenda/sitio"].includes(normalized)) return "Fazenda";
  if (normalized === "chacara") return "Chácara";
  return PROPERTY_TYPES.find((type) => normalizePropertyType(type) === normalized) || PROPERTY_TYPES[0];
}

export function PropertyForm({ property }: { property?: Property }) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<Property, "id">>(blankProperty);
  const [files, setFiles] = useState<File[]>([]);
  const [newMain, setNewMain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [pendingHref, setPendingHref] = useState("");
  const baselineRef = useRef("");
  const allowNavigationRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const requiresRooms = !TYPES_WITH_OPTIONAL_ROOMS.has(normalizePropertyType(form.type));

  useEffect(() => {
    if (!property) {
      setForm(blankProperty);
      baselineRef.current = JSON.stringify(blankProperty);
      setReady(true);
      return;
    }
    const { id: _, ...data } = property;
    const initialForm = { ...blankProperty, ...data, type: normalizeStoredPropertyType(data.type), suites: data.suites ?? 0 };
    setForm(initialForm);
    baselineRef.current = JSON.stringify(initialForm);
    setReady(true);
  }, [property]);

  const hasChanges = ready && (JSON.stringify(form) !== baselineRef.current || files.length > 0 || newMain);

  useEffect(() => {
    if (!hasChanges) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptLinks = (event: MouseEvent) => {
      if (allowNavigationRef.current || event.button !== 0) return;
      const target = event.target as Element | null;
      const logout = target?.closest('[data-unsaved-action="logout"]');
      if (logout) {
        event.preventDefault();
        event.stopPropagation();
        setPendingHref("__logout__");
        setExitPrompt(true);
        return;
      }
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(anchor.href);
      setExitPrompt(true);
    };
    const detectTabChange = () => {
      if (document.visibilityState !== "hidden" || allowNavigationRef.current) return;
      setPendingHref("");
      setExitPrompt(true);
    };
    const interceptBrowserBack = () => {
      if (allowNavigationRef.current) return;
      window.history.pushState({ unsavedGuard: true }, "", window.location.href);
      setPendingHref("__back__");
      setExitPrompt(true);
    };
    window.history.pushState({ unsavedGuard: true }, "", window.location.href);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptLinks, true);
    document.addEventListener("visibilitychange", detectTabChange);
    window.addEventListener("popstate", interceptBrowserBack);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptLinks, true);
      document.removeEventListener("visibilitychange", detectTabChange);
      window.removeEventListener("popstate", interceptBrowserBack);
    };
  }, [hasChanges]);

  function setMain(index: number) {
    setForm((current) => ({ ...current, images: [current.images[index], ...current.images.filter((_, itemIndex) => itemIndex !== index)] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return setNotice("Informe um título válido.");
    if (!form.description.trim()) return setNotice("Informe uma descrição válida.");
    if (form.price <= 0 || form.area <= 0) return setNotice("Preço e área devem ser maiores que zero.");
    if (requiresRooms && (form.bedrooms <= 0 || form.bathrooms <= 0)) return setNotice("Informe a quantidade de quartos e banheiros para este tipo de imóvel.");
    if (!form.images.length && !files.length) return setNotice("Adicione pelo menos uma foto do imóvel.");
    if (form.images.length + files.length > 30) return setNotice("Cada imóvel pode ter no máximo 30 fotos.");
    setBusy(true);
    try {
      setNotice(files.length ? "Comprimindo e enviando imagens..." : "Salvando imóvel...");
      const uploaded = files.length ? await uploadPropertyImages(files, setNotice) : [];
      const images = newMain && uploaded.length ? [...uploaded, ...form.images] : [...form.images, ...uploaded];
      const data = { ...form, images, slug: form.slug || form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
      const id = await saveProperty(data, property?.id);
      const warnings: string[] = [];
      const removedImages = property?.images.filter((image) => !images.includes(image)) || [];
      if (removedImages.length) {
        setNotice("Removendo fotos antigas do Cloudinary...");
        await deleteCloudinaryImages(removedImages).catch(() => warnings.push("Algumas fotos antigas podem precisar de limpeza no Cloudinary."));
      }
      await addAudit(property ? "Imóvel editado" : "Imóvel cadastrado", `${form.title} · Código ${id.slice(0,8).toUpperCase()}`).catch(() => warnings.push("O imóvel foi salvo, mas o histórico não pôde ser registrado."));
      if (property) {
        allowNavigationRef.current = true;
        baselineRef.current = JSON.stringify(data);
        if (warnings.length) window.alert(`Alterações salvas. ${warnings.join(" ")}`);
        if (pendingHref === "__logout__") await signOut(auth);
        else if (pendingHref === "__back__") window.history.go(-2);
        else if (pendingHref) window.location.assign(pendingHref);
        else router.push("/admin/imoveis");
      }
      else { setForm(blankProperty); setFiles([]); setNewMain(false); setNotice(warnings.length ? `Imóvel cadastrado. ${warnings.join(" ")}` : "Imóvel cadastrado com sucesso."); }
    } catch (error) {
      setNotice(`Não foi possível salvar: ${error instanceof Error ? error.message : "erro inesperado"}`);
    } finally { setBusy(false); }
  }

  async function discardAndLeave() {
    allowNavigationRef.current = true;
    if (pendingHref === "__logout__") await signOut(auth);
    else if (pendingHref === "__back__") window.history.go(-2);
    else window.location.assign(pendingHref || "/admin/imoveis");
  }

  function saveAndLeave(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setExitPrompt(false);
    formRef.current?.requestSubmit();
  }

  return <><form ref={formRef} className="property-form admin-panel" onSubmit={submit}>
    <div className="admin-page-head"><div className="admin-head-icon"><Plus/></div><div><span>{property ? "Edição" : "Novo cadastro"}</span><h1>{property ? "Editar imóvel" : "Cadastrar imóvel"}</h1><p>Preencha as informações e organize as fotos do anúncio.</p></div></div>
    <div className="fields">
      <label className="wide">Título<input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required placeholder="Ex.: Casa contemporânea no Lago Sul"/></label>
      <label>Transação<select value={form.transaction} onChange={(e)=>setForm({...form,transaction:e.target.value as Property["transaction"]})}><option>Compra</option><option>Locação</option></select></label>
      <label>Tipo<select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>{PROPERTY_TYPES.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label className="wide">Localização<select value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} required>{LOCATIONS.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label>Preço (R$)<CurrencyInput value={form.price} onValueChange={(price)=>setForm({...form,price})} required/></label>
      <label>Área (m²)<input type="number" min="1" value={form.area || ""} onChange={(e)=>setForm({...form,area:+e.target.value})} required/></label>
      <label>Quartos{!requiresRooms && <small>opcional para este tipo</small>}<input type="number" min="0" value={form.bedrooms || ""} onChange={(e)=>setForm({...form,bedrooms:+e.target.value})}/></label>
      <label>Banheiros{!requiresRooms && <small>opcional para este tipo</small>}<input type="number" min="0" value={form.bathrooms || ""} onChange={(e)=>setForm({...form,bathrooms:+e.target.value})}/></label>
      <label>Suítes<input type="number" min="0" value={form.suites || ""} onChange={(e)=>setForm({...form,suites:+e.target.value})}/></label>
      <label>Vagas<input type="number" min="0" value={form.parking || ""} onChange={(e)=>setForm({...form,parking:+e.target.value})}/></label>
      <label className="wide">Descrição<textarea rows={6} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} required/></label>
      {form.images.length > 0 && <div className="existing-images wide"><div><ImageIcon/><b>Fotos cadastradas</b><small>A primeira foto é a capa do imóvel.</small></div><div className="image-manager">{form.images.map((image,index)=><article key={`${image}-${index}`} className={index===0?"main":""}><div><Image src={image} alt={`Foto ${index+1}`} fill sizes="150px"/></div>{index===0?<span><Star/> Principal</span>:<button type="button" onClick={()=>setMain(index)}><Star/> Tornar principal</button>}<button type="button" className="remove-image" onClick={()=>setForm({...form,images:form.images.filter((_,i)=>i!==index)})} aria-label="Remover foto"><Trash2/></button></article>)}</div></div>}
      <label className="upload wide"><Upload/><b>Adicionar imagens *</b><span>Obrigatório adicionar pelo menos uma foto e permitido no máximo 30. Elas serão comprimidas e convertidas para WebP.</span><input type="file" accept="image/*" multiple required={!form.images.length} onChange={(e)=>{const chosen=Array.from(e.target.files||[]);const available=Math.max(0,30-form.images.length);const selected=chosen.slice(0,available);setFiles(selected);setNotice(chosen.length>available?`Somente ${available} foto(s) foram aceitas. O limite total é 30.`:selected.length?`${selected.length} arquivo(s) selecionado(s).`:"");}}/>{files.length>0&&<em>{files.length} nova(s) foto(s)</em>}</label>
      {property && files.length>0 && <label className="main-new wide"><input type="checkbox" checked={newMain} onChange={(e)=>setNewMain(e.target.checked)}/> Usar a primeira nova imagem como foto principal</label>}
    </div>
    <div className="form-actions"><button className="admin-btn" disabled={busy}>{busy?"Processando...":property?"Salvar alterações":"Cadastrar imóvel"}</button></div>
    {notice&&<p className="notice">{notice}</p>}
  </form>{exitPrompt && <div className="unsaved-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setExitPrompt(false)}}><section className="unsaved-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"><div className="unsaved-icon"><Save/></div><span>Alterações pendentes</span><h2 id="unsaved-title">Deseja salvar antes de sair?</h2><p>Você alterou informações deste imóvel. Escolha salvar as mudanças ou descartá-las antes de continuar.</p><div><button type="button" className="admin-btn" onClick={saveAndLeave}>Salvar alterações</button><button type="button" className="discard-changes" onClick={discardAndLeave}>Descartar</button><button type="button" className="keep-editing" onClick={()=>setExitPrompt(false)}>Continuar editando</button></div></section></div>}</>;
}
