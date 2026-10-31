# Redesign do app do entregador (fominha-driver)

Data: 2026-10-31. Protótipo aprovado: https://claude.ai/artifact/DJaVoKvSs56hnwTEp2KAgX

## Objetivo

Trocar o visual das 18 telas do fominha-driver por uma direção nova ("painel de bordo"), feita para ser lida de relance por quem trabalha de moto ou bicicleta, mantendo a marca Fominha e sem alterar nenhuma regra de negócio.

## Fora do escopo

- Hooks e contextos: `useOffers`, `useLocationTracking`, `AuthContext`, `DriverContext`, chamadas de API, navegação, os três passos da entrega e a validação do código de confirmação.
- Novas funcionalidades (ganhos do dia, histórico por período, gamificação).
- Os apps do cliente e o web (têm planos próprios).

## Marca e tokens

Valem a folha de marca (`docs/marca/referencias-da-marca.pdf`) e a decisão de 2026-10-31.

| Papel | Claro | Escuro |
| --- | --- | --- |
| Ação / progresso | `#F59E0B` | `#F59E0B` |
| Texto laranja sobre claro | `#B45309` | `#F59E0B` |
| Texto sobre laranja | `#1F1F1F` | `#1F1F1F` |
| Fundo | `#FFFDF8` | `#121110` |
| Cartão | `#FFFFFF` | `#1D1B19` |
| Bloco de destaque (online, saldo) | `#1F1F1F` | `#1D1B19` com borda `#312D28` |
| Texto principal | `#1F1F1F` | `#FFF6E5` |
| Texto secundário | `#6E6A66` | `#B5AEA4` |
| Linha | `#EFE7D9` | `#312D28` |
| Dinheiro que entra | `#2E7D32` | `#7CC47F` |

Regras: nunca branco sobre laranja; laranja só em ação e progresso; verde só em dinheiro que entra; nada depende só de cor (entradas e saídas levam + e −).

Tipografia: Poppins (400, 500, 600, 700, 800) em números, títulos e botões; fonte do sistema no texto corrido pequeno. Corpo em 16–17 pt, nada abaixo de 12 pt.

Alvos de toque: botão principal 64 pt, secundário 56 pt, qualquer controle tocável com no mínimo 44 pt.

Tema: claro e escuro seguem o celular (`useColorScheme`). Sem seletor no app.

Ícones: lucide-react-native já instalado, em traço. O duotone da folha de marca fica como melhoria futura; não vale uma dependência nova agora.

## Telas

1. **Início** (`app/(tabs)/home.tsx`): saudação com iniciais; bloco de estado (online/offline) com botão grande; atalho do saldo. A oferta aparece como folha inferior.
2. **Oferta**: valor em Poppins 800, anel de contagem regressiva, rota em duas pernas (restaurante e bairro de entrega), Recusar (secundário) e "Aceitar corrida" (principal, 64 pt).
3. **Entrega ativa** (`app/delivery/active.tsx`): mapa no topo com Navegar e tempo previsto sobre ele; os 3 passos; destino atual; cliente e "você recebe"; um botão do próximo passo fixo no pé. O modal do código de confirmação recebe o mesmo tratamento.
4. **Carteira** (`app/(tabs)/wallet.tsx`): bloco de saldo com pendente, em análise e campo de saque; extrato agrupado com sinal.
5. **Perfil** (`app/(tabs)/profile.tsx`): cabeçalho com identidade; campos agrupados; ações de ajuda, termos e sair; excluir conta discreto.
6. **Demais telas** recebem os mesmos componentes e tokens: login, cadastro, recuperar senha, cadastro de entregador, aprovação pendente, avisos, saques, termos, excluir conta, abertura.

## Estrutura de código

- Tokens: `src/ui/theme.ts` (paletas clara e escura, `usePalette`), `ThemeRoot` que injeta as cores como variáveis CSS do NativeWind (`vars`) e `tailwind.config.js` apontando as cores para essas variáveis. Assim as 15 classes de cor já usadas (`text-foreground`, `bg-card`…) passam a trocar de tema sem editar cada tela; `usePalette` serve onde classe não alcança (ícones, marcadores de mapa).
- Componentes novos em `src/ui/`: `StateCard` (bloco carvão), `OfferSheet`, `CountdownRing`, `RouteLegs`, `StepTracker`, `BalanceCard`, `LedgerList`, `Avatar`, `ListGroup`.
- `Button.tsx` ganha a variante de altura 64 e o laranja de texto `#B45309`; a API de props continua compatível para as telas que não mudam de uma vez.
- Cada tela troca o JSX e as classes; hooks, handlers e estados ficam onde estão.
- `home.tsx` mistura lógica e visual: extrair `OfferCard` e o bloco online para componentes, sem mexer nos hooks.

## Mudança no backend (única fora do visual)

`GET /deliveries/offers` (`fominha-back/src/delivery/infra/http/delivery.controller.ts`) hoje devolve a linha crua de `DeliveryOffer`. Passa a incluir, sem remover nenhum campo existente:

> Distâncias (km) ficaram fora: o banco não guarda coordenadas de restaurante nem do endereço de entrega (o app as obtém por geocodificação do Google). Calcular isso por oferta aumentaria custo e latência; entra em outra rodada se fizer falta.

| Campo novo | Origem |
| --- | --- |
| `pickup_name` | `establishment.tx_name` do pedido |
| `pickup_district` | `establishment.address.tx_district` |
| `dropoff_district` | `order.address.tx_district` |

Compatibilidade: campos novos são opcionais no tipo `DeliveryOffer` do app. Se vierem ausentes ou `null`, `RouteLegs` não é exibido e a oferta mostra só valor e contagem, no mesmo layout. A oferta mostra restaurante e bairro de retirada e bairro de entrega, sem distância.

## Erros e estados

Mantêm o comportamento atual (mensagens de `showError`, `DriverLoadError`, `EmptyState`, `LoadingSpinner`), só com o novo visual. A oferta que expira some da lista como hoje (`secondsUntil` chega a 0).

## Acessibilidade

- Contraste mínimo 4,5:1 em texto e 3:1 em ícones, nos dois temas (calculado, não estimado).
- Rótulos para leitor de tela em todo controle só de ícone; o anel diz "18 segundos para aceitar".
- Texto acompanha o tamanho de fonte do sistema; layouts testados em 130%.
- Movimento reduzido: sem animação do anel e da folha quando `AccessibilityInfo.isReduceMotionEnabled()`.
- Vibração e som na chegada de oferta ficam como estão (não é escopo).

## Testes

- Os 10 testes existentes continuam passando; os que conferem texto de tela são ajustados só se o texto mudar.
- Novos testes de unidade para `CountdownRing` (proporção do anel), `RouteLegs` (some sem dados) e as funções de formatação.
- No back: teste do endpoint de ofertas com e sem coordenadas.
- Rodar um arquivo de teste por vez.
- Verificação visual no aparelho fica com o usuário (build na nuvem, EAS).

## Ordem de entrega

1. Tokens, `theme.ts`, `Button` e componentes base.
2. Início e oferta, com o back (tipo opcional primeiro, back depois).
3. Entrega ativa.
4. Carteira e Perfil.
5. Telas de autenticação e restantes.
6. Revisão final com a skill apple-design em cada tela e nos dois temas.
