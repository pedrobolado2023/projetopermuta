# 02. Product Strategy, Growth, Gamification & Business Rules
## Plataforma de Permuta Hoteleira (StaffStay / HostPass)

---

## 1. Product Roadmap (MVP ao Global)

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   FASE 1: MVP    │───>│   FASE 2: BETA   │───>│   FASE 3: LATAM  │───>│  FASE 4: GLOBAL  │
│  (Meses 0 - 6)   │    │  (Meses 7 - 18)  │    │ (Meses 19 - 36)  │    │  (Meses 37+)     │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
 • Motor Web PWA         • App Nativo iOS/Android• Expansão Argentina,   • Expansão EUA &
 • Validação OCR/Facial   • Conectores PMS XML/REST  Chile, Colômbia, MX  Europa (SaaS Global)
 • Allotment Manual      • Precificação Dinâmica • Multi-moeda & Lang    • Integração Amadeus/
 • 300 Hotéis Brasil     • Engine de Gamificação • Checkout em Cripto/FX   Sabre Nível Global
```

### Detalhamento por Fase:

#### Fase 1: MVP & Validação de Tese (Meses 0 a 6)
- **Foco:** Lançamento no Brasil com PWA (Progressive Web App) responsivo.
- **Funcionalidades:**
  - Onboarding self-service de Hotéis e aprovação manual/automatizada via CNPJ/Receita.
  - Cadastro de Funcionários com OCR de documento (RG/CNH), Selfie de Prova de Vida e Comprovante de Vínculo.
  - Gestão de Allotment Manual (Painel do Hotel).
  - Reserva 100% online com checkout PIX e Cartão de Crédito com Split Automático.
  - Emissão de Voucher digital com QR Code para Check-in.
- **Meta:** 300 hotéis cadastrados e 25.000 usuários validados no Brasil.

#### Fase 2: Beta Nacional & Automação PMS (Meses 7 a 18)
- **Funcionalidades:**
  - Apps nativos iOS (Swift/SwiftUI) e Android (Kotlin/Jetpack Compose).
  - Integração com conectores de PMS (Omnibees, Desbravador, Cloudbeds, TOTVS CMNet).
  - Algoritmo de Allotment Dinâmico Inteligente (liberação automática de vagas quando a ocupação do hotel cai abaixo de 40%).
  - Módulo de Gamificação (Missões, Níveis, Badges e Cashback).
  - Venda de Add-ons (Café da manhã, Late Check-out, Spa, Passeios).

#### Fase 3: Expansão América Latina (Meses 19 a 36)
- **Funcionalidades:**
  - Internacionalização (Português, Espanhol, Inglês).
  - Suporte a multi-moedas (BRL, ARS, CLP, MXN, USD) com conversão dinâmica.
  - Integração com PMS latino-americanos (Erbon, Cloudbeds, Oracle OPERA LatAm).
  - Verificação de identidade com suporte a documentos internacionais (DNI, Passaporte).

#### Fase 4: Operação Global & Ecossistema (Meses 37+)
- **Funcionalidades:**
  - Expansão para Estados Unidos e Europa.
  - Parcerias globais de inventário aéreo e rodoviário com tarifas de staff.
  - API aberta (Open API) para integração com redes globais de hotéis.

---

## 2. Estratégia de Aquisição de Hotéis (B2B Growth)

```
                               ┌───────────────────────────┐
                               │  Prospecção B2B Hoteleira │
                               └─────────────┬─────────────┘
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      │                                      │                                      │
┌─────┴─────────────────────┐  ┌─────────────┴─────────────┐  ┌─────────────────────┴─────┐
│  PARCERIAS INSTITUCIONAIS │  │   INSIDE SALES & BOT    │  │  INCENTIVO DE REDE (MGM)  │
│  ABIH, FOHB, RESORTEIROS  │  │ Outbound focado em GMs e │  │ Indique um Hotel Parceiro │
│  E SINDICATOS DE HOTELARIA│  │ Directors of Revenue (RM)│  │ e ganhe isenção de taxa   │
└───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘
```

### 1. Parcerias Institucionais com Associações Hoteleiras
- Acordo com entidades de classe (**ABIH - Associação Brasileira da Indústria de Hotéis**, **FOHB - Fórum de Operadores Hoteleiros do Brasil**, **RESORTEIROS**).
- **Pitch de Valor:** Oferecer a plataforma aos associados como canal oficial de desova de inventário ocioso sem concorrência de tarifas públicas.

### 2. Atração via RHs Hoteleiros (Employee Benefit Channel)
- Apresentar o HostPass aos diretores de RH das redes hoteleiras como um **Benefício Corporativo Gratuito** para seus funcionários.
- Em troca de cadastrar o hotel e liberar allotment, todos os funcionários daquela rede ganham conta Premium gratuita na plataforma.

### 3. Engine de Outbound & Inside Sales Automatizado
- Scraping ético de diretórios hoteleiros públicos e envio de campanhas personalizadas para Gerentes Gerais (GM) e Gerentes de Revenue Management (RM), demonstrando a matemática da receita incremental de A&B com ocupação de quartos ociosos.

---

## 3. Estratégia de Aquisição de Usuários (B2C Growth Virality)

```
 ┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
 │ 1. RH do Hotel Parceiro  │ ───> │ 2. Onboarding do Staff   │ ───> │ 3. Viral Loop (Indique)  │
 │ Notifica os funcionários │      │ Cadastro de equipe em    │      │ Funcionário convida      │
 │ sobre o benefício HostPass│     │ massa via lista corporativa│    │ colegas e ganha Cashback │
 └──────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
```

### 1. Onboarding em Massa via RH (B2B2C Direct Feed)
- Integração da plataforma com a folha de pagamento / sistema de RH do hotel para validação prévia em lote dos funcionários ativos.

### 2. Viral Loop de Indicação Hoteleira ("Staff Invite Staff")
- Cada usuário aprovado ganha **3 convites exclusivos** para indicar colegas da indústria hoteleira.
- **Incentivo:** A cada amigo indicado que realiza a primeira reserva, o usuário indicador recebe **R$ 30,00 de saldo cashback** em sua carteira digital HostPass.

### 3. Comunidades Orgânicas de Hotelaria
- Presença ativa em grupos de WhatsApp, Telegram, LinkedIn e redes sociais de profissionais de hotelaria, governança e recepção.

---

## 4. Motor de Regras de Negócio (Business Rules Engine)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REGRAS DE NEGÓCIO DA PLATAFORMA                           │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ REGRA                    │ ESPECIFICAÇÃO TÉCNICA / PARÂMETROS                          │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Elegibilidade        │ Exclusivo para funcionários ativos/aposentados de hotéis    │
│                          │ com vínculo comprovado por documento + selfie + e-mail RH.   │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 2. Teto do Acompanhante │ O titular pode levar até 3 acompanhantes na mesma acomodação.│
│                          │ O titular DEVE estar presente no check-in obrigatoriamente. │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 3. Limite de Reservas    │ Máximo de 2 quartos por usuário na mesma data.              │
│                          │ Limite anual de 30 diárias por usuário na tarifa staff.     │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 4. Janela de Allotment  │ As vagas de permuta são abertas com 30 a 60 dias de anteced.│
│                          │ Liberação de last-minute automática (1 a 7 dias antes).     │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 5. Estadia Mín / Máx    │ Estadia mínima configurável pelo hotel (ex: 1 diária).      │
│                          │ Estadia máxima permitida: 7 diárias consecutivas por hotel.  │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 6. Blackout Dates        │ O hotel pode cadastrar dias de bloqueio total (Feriados,    │
│                          │ Réveillon, Carnaval, alta temporada) sem penalidade.        │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 7. Política Cancelamento │ Cancelamento grátis até 7 dias antes do check-in.           │
│                          │ Menos de 7 dias: retenção da 1ª diária + taxa de serviço.   │
│                          │ No-show: perda integral e alerta de conduta no perfil.     │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 8. Restrição Anti-Revenda│ Proibida a comercialização/revenda do voucher. Infração leva│
│                          │ a banimento imediato e notificação ao RH empregador.        │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 5. Módulo de Gamificação & Fidelização (Gamification Engine)

```
               ┌──────────────────────────────────────────────────────────┐
               │              SISTEMA DE STACKS E CRISTAIS                │
               ├──────────────────────────────────────────────────────────┤
               │  [ BRONZE ]  ➜ 0 a 3 reservas/ano (1% Cashback)           │
               │  [ SILVER ]  ➜ 4 a 8 reservas/ano (3% Cashback + Early)   │
               │  [ GOLD   ]  ➜ 9 a 15 reservas/ano (5% Cashback + Upgrade)│
               │  [ PLATINUM] ➜ 16+ reservas/ano (8% Cashback + VIP Pass)  │
               └──────────────────────────────────────────────────────────┘
```

### 1. Níveis de Status (Tiers)
1. **Bronze Staff (Iniciante):** Acesso ao inventário padrão e 1% de cashback.
2. **Silver Staff (Viajante Frequente):** Acesso antecipado a allotments de fim de semana, 3% de cashback e badge exclusivo.
3. **Gold Staff (Explorer Hoteleiro):** 5% de cashback, desconto de 20% em Add-ons (Café/Spa) e prioridade na fila de espera.
4. **Platinum Master (Legendary):** 8% de cashback, facilidade de cancelamento flexível no-questions-asked e 1 upgrade de categoria gratuito por ano conforme disponibilidade.

### 2. Missões e Badges (Conquistas)
- **"Explorador de Resorts":** Reserve 3 resorts diferentes em 1 ano ➔ Ganhe R$ 100 em cupom de A&B.
- **"Reviewer Campeão":** Escreva 5 avaliações detalhadas com fotos do hotel ➔ Ganhe 500 cristais de experiência.
- **"Embaixador da Recepção":** Indique 5 colegas de trabalho aprovados ➔ Ganhe 1 diária grátis em hotel parceiro categoria Silver.

### 3. Programa de Cashback Sustentável
- Todo valor de cashback acumulado é armazenado em uma **Carteira Digital Integrada (HostWallet)** na plataforma e só pode ser utilizado para abater o valor de futuras reservas ou add-ons dentro da própria rede.
