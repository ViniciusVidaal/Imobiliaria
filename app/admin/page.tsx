"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Edit3,
  LogOut,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { LOCATIONS, PROPERTY_TYPES, money } from "@/lib/constants";
import {
  removeProperty,
  saveProperty,
  setSold,
  subscribeProperties,
} from "@/lib/properties";
import { uploadPropertyImages } from "@/lib/upload";
import type { Property } from "@/lib/types";
import { LoadTestPanel } from "@/components/LoadTestPanel";
import "./admin.css";
const blank = {
  title: "",
  slug: "",
  description: "",
  transaction: "Compra",
  type: "Apartamento",
  location: LOCATIONS[0],
  address: "",
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  area: 0,
  images: [] as string[],
  featured: false,
  sold: false,
} as Omit<Property, "id">;
export default function Admin() {
  const [user, setUser] = useState<unknown>(undefined),
    [items, setItems] = useState<Property[]>([]),
    [editing, setEditing] = useState<Property | null>(null),
    [form, setForm] = useState(blank),
    [files, setFiles] = useState<File[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => (user ? subscribeProperties(setItems) : undefined), [user]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      await signInWithEmailAndPassword(
        auth,
        String(d.get("email")),
        String(d.get("password")),
      );
    } catch {
      setNotice("E-mail ou senha inválidos.");
    }
  }
  function edit(p: Property) {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.images.length + files.length > 30) {
      setNotice("Cada imóvel pode ter no máximo 30 fotos.");
      return;
    }
    setBusy(true);
    setNotice(
      files.length ? "Comprimindo imagens para WebP..." : "Salvando imóvel...",
    );
    try {
      const uploaded = files.length
        ? await uploadPropertyImages(files, setNotice)
        : [];
      setNotice("Salvando dados do imóvel...");
      const data = {
        ...form,
        images: [...form.images, ...uploaded],
        slug:
          form.slug ||
          form.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      };
      await saveProperty(data, editing?.id);
      setForm(blank);
      setFiles([]);
      setEditing(null);
      setNotice("Imóvel salvo com sucesso.");
    } catch (err) {
      setNotice(
        `Não foi possível salvar: ${err instanceof Error ? err.message : "erro inesperado"}`,
      );
    } finally {
      setBusy(false);
    }
  }
  if (user === undefined)
    return (
      <main className="admin-shell">
        <p>Carregando...</p>
      </main>
    );
  if (!user)
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="brand big">
            <span>AL</span>
            <b>7</b>
            <small>IMÓVEIS</small>
          </div>
          <h1>Painel administrativo</h1>
          <p>Entre com seu e-mail e senha cadastrados no Firebase.</p>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <label>
            Senha
            <input name="password" type="password" required />
          </label>
          {notice && <p className="notice">{notice}</p>}
          <button className="admin-btn">Entrar no painel</button>
        </form>
      </main>
    );
  return (
    <main className="admin-shell">
      <header>
        <div>
          <span>AL7 GESTÃO</span>
          <h1>{editing ? "Editar imóvel" : "Novo imóvel"}</h1>
        </div>
        <button onClick={() => signOut(auth)}>
          <LogOut /> Sair
        </button>
      </header>
      <section className="admin-grid">
        <form className="property-form" onSubmit={submit}>
          <div className="form-title">
            <Plus />
            <div>
              <h2>Informações do imóvel</h2>
              <p>Preencha os dados que aparecerão no site.</p>
            </div>
          </div>
          <div className="fields">
            <label className="wide">
              Título
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Ex.: Casa contemporânea no Lago Sul"
              />
            </label>
            <label>
              Transação
              <select
                value={form.transaction}
                onChange={(e) =>
                  setForm({
                    ...form,
                    transaction: e.target.value as "Compra" | "Locação",
                  })
                }
              >
                <option>Compra</option>
                <option>Locação</option>
              </select>
            </label>
            <label>
              Tipo
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {PROPERTY_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Localização
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                {LOCATIONS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Endereço
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label>
              Preço (R$)
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
              />
            </label>
            <label>
              Área (m²)
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: +e.target.value })}
              />
            </label>
            <label>
              Quartos
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) =>
                  setForm({ ...form, bedrooms: +e.target.value })
                }
              />
            </label>
            <label>
              Banheiros
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm({ ...form, bathrooms: +e.target.value })
                }
              />
            </label>
            <label>
              Vagas
              <input
                type="number"
                value={form.parking}
                onChange={(e) => setForm({ ...form, parking: +e.target.value })}
              />
            </label>
            <label className="wide">
              Descrição
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </label>
            <label className="upload wide">
              <Upload />
              <b>Adicionar fotos</b>
              <span>
                JPG/PNG serão convertidos para WebP (~150 KB). Máximo de 30
                fotos por imóvel.
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  const available = Math.max(0, 30 - form.images.length);
                  if (selected.length > available) {
                    setFiles(selected.slice(0, available));
                    setNotice(
                      `Limite de 30 fotos. Foram selecionadas apenas ${available}.`,
                    );
                    return;
                  }
                  setFiles(selected);
                  setNotice("");
                }}
              />
              {files.length > 0 && (
                <em>{files.length} arquivo(s) selecionado(s)</em>
              )}
            </label>
          </div>
          <div className="form-actions">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
              >
                Cancelar
              </button>
            )}
            <button className="admin-btn" disabled={busy}>
              {busy ? "Processando..." : "Salvar imóvel"}
            </button>
          </div>
          {notice && <p className="notice">{notice}</p>}
        </form>
        <aside>
          <h2>
            Imóveis cadastrados <span>{items.length}</span>
          </h2>
          <div className="admin-list">
            {items.map((p) => (
              <article key={p.id}>
                <div>
                  <small>
                    {p.type} · {p.transaction}
                  </small>
                  <h3>{p.title}</h3>
                  <strong>{money(p.price)}</strong>
                  {p.sold && <span className="sold">Vendido</span>}
                </div>
                <div className="row-actions">
                  <button title="Editar" onClick={() => edit(p)}>
                    <Edit3 />
                  </button>
                  <button
                    title="Marcar vendido"
                    onClick={() => setSold(p.id, !p.sold)}
                  >
                    <CheckCircle2 />
                  </button>
                  <button
                    title="Excluir"
                    className="danger"
                    onClick={() =>
                      confirm("Excluir este imóvel permanentemente?") &&
                      removeProperty(p.id)
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
            {!items.length && (
              <p className="empty">Nenhum imóvel cadastrado ainda.</p>
            )}
          </div>
        </aside>
      </section>
      <LoadTestPanel properties={items} />
    </main>
  );
}
