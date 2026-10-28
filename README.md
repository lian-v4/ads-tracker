# ⚡ Ads Tracker - Painel de Tráfego em Tempo Real

Aplicação completa para consolidar e exibir métricas de **Meta Ads** (Facebook/Instagram) e **Google Ads** de um cliente em um dashboard moderno que se **atualiza sozinho na tela**.

Projetado especificamente para rodar com **deploy gratuito na Vercel** conectado ao banco **PostgreSQL no Neon**.

---

## 🚀 Como Funciona a Solução por Scripts (Sem Burocracia)

1. **Google Ads (Zero aprovação):**
   - Você cola o código de [`scripts/google-ads-script.js`](./scripts/google-ads-script.js) na aba de Scripts da conta do Google Ads do cliente.
   - O Google Ads roda de hora em hora e envia os dados consolidados via `POST` para `/api/sync/google`.

2. **Meta Ads:**
   - Com o token de acesso da BM (`ads_read`) e o ID da conta (`act_...`), o script [`scripts/meta-ads-sync.js`](./scripts/meta-ads-sync.js) puxa os dados do dia e envia para `/api/sync/meta`.

3. **Dashboard Web (HTML Auto-atualizável):**
   - Apresenta KPIs gerais (Investimento, Faturamento, ROAS, Conversões, CPA, Cliques, CTR, CPC).
   - Divide o desempenho lado a lado: **Meta Ads** vs **Google Ads**.
   - Tabela detalhada de campanhas com filtros de período (*Hoje*, *Ontem*, *7D*, *30D*, *Tudo*).
   - **Auto-Refresh automático**: faz polling silencioso a cada 30 segundos com contagem regressiva visual.

---

## 🛠️ Deploy na Vercel (Passo a Passo)

1. Suba esta pasta para um repositório no seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New > Project**.
3. Importe o repositório `ads-tracker`.
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: `postgresql://lian:4SSn4pUx4ZRD3tvs9Pb1FH3Z@ep-small-fog-aul39lpp-pooler.c-10.us-east-1.aws.neon.tech/ads_dashboard?sslmode=require`
   - `SYNC_SECRET_TOKEN`: `ads_tracker_secret_token_12345` (ou qualquer senha que preferir)
5. Clique em **Deploy**.
6. Pronto! Sua aplicação estará no ar em `https://seu-projeto.vercel.app`.

---

## 💻 Testando Localmente

1. Abra a pasta do projeto no terminal:
   ```bash
   cd ads-tracker
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse no navegador: `http://localhost:3001`

