# AL7 Imóveis

Site imobiliário dinâmico com Next.js, Tailwind CSS e Firebase.

## Instalação

```bash
npm install
npm run dev
```

Copie `.env.local.example` para `.env.local` e configure os valores. O projeto já inclui um `.env.local` funcional, ignorado pelo Git.

## Firebase

1. Em Authentication, habilite **E-mail/senha** e crie o usuário administrador.
2. Crie o Firestore em produção na região `southamerica-east1`.
3. Habilite o Storage.
4. Publique as regras: `npx firebase-tools deploy --only firestore:rules,storage`.
5. Acesse `/admin`, autentique-se e cadastre o primeiro imóvel.

O site e o painel escutam a coleção `properties` em tempo real. Antes do upload, imagens são comprimidas e convertidas para WebP no navegador.

## Deploy na Vercel

Importe o repositório e cadastre todas as variáveis `NEXT_PUBLIC_FIREBASE_*` do `.env.local.example`. O comando de build é `npm run build`.
