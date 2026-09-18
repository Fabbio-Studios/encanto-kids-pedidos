# Encanto Kids - Pedidos de roupas

Aplicativo web mobile-first para cadastrar pedidos de roupas rapidamente, com foco em simplicidade e uso no celular.

## Funcionalidades

- Cadastro rápido de produtos por código, cor, quantidade e tamanho
- Lista visual de produtos com edição e exclusão
- Resumo do pedido com total de itens e peças
- Geração de arquivo XLSX compatível com Excel e Google Sheets
- Persistência local com localStorage para não perder o pedido
- Fluxo de revisão antes de exportar
- Design mobile-first e responsivo
- Suporte a PWA para instalação na tela inicial do celular
- Configuração pronta para GitHub Pages

## Como instalar

```bash
npm install
```

## Como rodar localmente

```bash
npm run dev
```

Acesse a URL exibida no terminal, normalmente em http://localhost:5173.

## Como gerar build

```bash
npm run build
```

O resultado ficará dentro da pasta `dist`.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie o código para o repositório.
3. No GitHub, ative a seção "Pages" e escolha a opção "GitHub Actions".
4. O workflow em `.github/workflows/pages.yml` faz a instalação, build e publicação automaticamente.
5. Se o nome do repositório for diferente de `encanto-kids-pedidos`, atualize a variável `VITE_BASE` no arquivo `vite.config.ts` e no workflow.

## Alterar tamanhos disponíveis

Edite o valor em `src/constants.ts`:

```ts
export const SIZE_OPTIONS = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;
```

## Alterar sugestões de cor

Edite a lista em `src/constants.ts`:

```ts
export const COLOR_SUGGESTIONS = [
  'Preto',
  'Branco',
  'Azul',
  'Vermelho'
];
```

## Estrutura principal

- `src/App.tsx` — fluxo principal da aplicação
- `src/utils/exportExcel.ts` — geração da planilha XLSX
- `src/constants.ts` — tamanhos e cores sugeridas
- `src/styles.css` — interface e responsividade

## Compatibilidade

- Excel
- Google Sheets
- Navegadores modernos
- GitHub Pages

## Observação

A primeira versão gera um arquivo XLSX que pode ser aberto diretamente no Google Sheets e em planilhas locais.
