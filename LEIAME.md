# Artur · Analista de Mercado Omega

Aplicativo de página única (`index.html`) que gera o estudo preliminar de uma região para uma franquia Omega Academia a partir de um endereço, seguindo o escopo `Artur_Analista_Mercado_Omega.md`.

## Como usar
1. Baixe `index.html` e abra no Chrome, Edge ou Firefox (duplo clique). Precisa de internet; não precisa instalar nada.
2. Digite o endereço com número, cidade e UF (ou coordenadas `-23.5613, -46.6565`) e clique em **Analisar região**.
3. Opcional: abra **Dados do imóvel e do negócio** e informe área, aluguel, custos fixos, ticket, margem, investimento e capacidade para liberar os cenários financeiros, o ponto de equilíbrio e o payback.
4. Use **Baixar PDF executivo** para o relatório A4 (capa, sumário com páginas, 12 seções, gráficos, SWOT e apêndices), **Baixar .md** para colar no GPT Artur, ou **Dados .json**. Se alguma fonte falhar, **Refazer consultas** tenta de novo só o que faltou.
5. Cada análise fica salva no navegador (até 15). Clique para reabrir, ou marque de 2 a 4 e use **Comparar selecionadas** para ver os pontos lado a lado. O app avisa quando as coberturas da matriz são diferentes.
6. Consultas pesadas ficam em cache local por 7 dias. Marque **Consultar tudo de novo** para forçar dados atualizados; o relatório informa quando algo veio do cache.

## O que o estudo traz
O relatório segue a estrutura executiva: capa, sumário, resumo executivo (parecer e 3 a 5 conclusões), introdução e objetivos, metodologia, tamanho do mercado (TAM, SAM, SOM), território e acesso, perfil do consumidor, concorrência com matriz SWOT, canibalização, imóvel, viabilidade, matriz de decisão, conclusões e recomendações e apêndices. Cada tabela e gráfico traz fonte e data da consulta.

- Parecer preliminar (avançar, avançar com condições, renegociar, manter em estudo, descartar), confiança e cobertura dos pesos.
- Quadro de dados com a classificação de cada número: Verificada, Informada pelo usuário, Estimada, Hipótese de cenário, Não disponível.
- Moradores em 500 m, 1 km e 2 km e anéis sem sobreposição; estrutura etária, densidade e PIB per capita do município.
- Concorrentes até 3 km (academias, estúdios, lutas, funcional) com distância, segmento, horário e links para verificação; preço sempre "não verificado".
- Unidades Omega até 12 km (canibalização), transporte, escolas, comércio, escritórios, verticalização e barreiras (rodovias, ferrovias, rios).
- Matriz de pontuação com os pesos do escopo e critérios explícitos, três riscos principais e plano de validação.
- Com dados financeiros: cenários conservador/base/otimista em 24 meses, aluguel máximo suportável e sensibilidade.

## Fontes (gratuitas, consultadas na hora pelo navegador)
| Dado | Fonte |
|---|---|
| Endereço → coordenadas | Nominatim/OpenStreetMap (reserva: Photon) |
| Município, população, densidade, idade | IBGE: Localidades e SIDRA, Censo 2022 (tabelas 4714 e 9514) |
| PIB per capita | IBGE: PIB dos Municípios (5938) ÷ estimativa de população (6579) |
| Moradores por raio | WorldPop Global 2020, grade de 100 m (estimativa de modelo) |
| Concorrência, entorno, barreiras | OpenStreetMap via Overpass API |

## Limitações conhecidas
- Renda do entorno, população diurna, fluxo e preços dos concorrentes não vêm de API pública aberta: aparecem como "Não disponível" e entram no plano de validação.
- O OpenStreetMap é mapeado por voluntários; a lista de concorrentes e de unidades Omega pode estar incompleta.
- Distâncias em linha reta; isócronas (5/10/15 min) não são calculadas.
- As penetrações dos cenários são hipóteses editáveis, não demanda comprovada.
- Se uma fonte estiver fora do ar, o relatório sai assim mesmo, com a dimensão marcada como indisponível e a cobertura reduzida.

## Desenvolvimento
- `npm install && npx playwright install chromium`
- `npm test`: teste offline com todas as APIs simuladas (sem internet).
- `npm run smoke`: teste com as APIs reais em dois endereços; falha se IBGE ou OpenStreetMap não responderem.
- GitHub Actions: `testes.yml` roda os dois testes a cada push e toda segunda-feira; `pages.yml` publica o site no GitHub Pages a cada push na `main` (ativar em Settings → Pages → Source: GitHub Actions).

## Hospedagem na Hostinger

A cada push no `main`, o workflow `hostinger.yml` atualiza o branch `hostinger` só com `index.html`, `LEIAME.md` e `.htaccess` (HTTPS forçado, sem listagem de pastas, sem cache do HTML).

1. hPanel → Sites → (seu domínio) → Avançado → **Git**. Repositório `https://github.com/agbesolucoes/omega-analista-mercado.git`, branch `hostinger`, diretório em branco (instala em `public_html`, que precisa estar vazio; para um subdomínio, crie o subdomínio antes e escolha-o).
2. Clique em **Implantar**.
3. Para atualizar sozinho: em **Implantação automática**, copie a URL do webhook e salve como secret `HOSTINGER_WEBHOOK` no GitHub (Settings → Secrets and variables → Actions).

Alternativa manual: hPanel → Gerenciador de Arquivos → `public_html` → enviar `index.html` e `.htaccess`.

## Dentro da Central de Organização

O mesmo `index.html` roda embutido na tela **Mercado** da Central (repositório `agbesolucoes/tiago`, cópia em `public/analista/index.html`). Quando está num iframe do mesmo site, o analista manda cada estudo concluído para a Central (`postMessage` `omega:estudo`), aceita reabrir um estudo salvo (`omega:abrir`) e recebe o nome de quem assina (`omega:config`). Aberto sozinho, nada disso muda. Depois de alterar o analista aqui, rode `npm run analista:atualizar` na Central.
