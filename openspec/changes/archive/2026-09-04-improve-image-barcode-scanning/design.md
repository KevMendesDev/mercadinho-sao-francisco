## Context

O `BarcodeScanner` é um Client Component compartilhado por cadastro de produto e entrada de estoque. Hoje ele instancia `BrowserMultiFormatReader`, restringe formatos e faz leitura contínua com `{ facingMode: { ideal: "environment" } }`; não há restrição de resolução, análise de arquivo nem feedback para ausência de resultado. O `@zxing/browser` instalado fornece leitura de imagem por elemento HTML e a biblioteca de produto já aceita códigos numéricos de 8 a 14 dígitos.

## Goals / Non-Goals

**Goals:**

- Aumentar a chance de leitura de EAN/UPC em celulares sem alterar os consumidores do componente.
- Usar uma imagem escolhida ou capturada como alternativa local à câmera ao vivo.
- Liberar mídia e URLs temporárias em sucesso, erro, fechamento e desmontagem.

**Non-Goals:**

- Não criar upload, armazenamento ou endpoint de imagem.
- Não alterar a busca no catálogo, regras de cadastro ou o schema de produto.
- Não garantir leitura de código ilegível, borrado, cortado ou fora dos formatos suportados.

## Decisions

### Manter ZXing e configurar a sessão para códigos de varejo

O componente continuará com `@zxing/browser`, configurando explicitamente formatos atuais e dicas de decodificação apropriadas, além de restrições de vídeo com preferência pela câmera traseira e resolução suficiente. Isso preserva o bundle e o comportamento multiplataforma existente; trocar por uma API nativa de detecção criaria cobertura variável entre navegadores, especialmente em celulares.

### Decodificar arquivo no navegador com URL temporária

O modal incluirá um input de imagem, com captura sugerida pela câmera traseira em dispositivos móveis. A imagem será entregue ao leitor por um `blob:` URL e decodificada no cliente; a URL será revogada após a tentativa. Isso cobre tanto a foto fornecida quanto fotos novas, sem custos, latência ou exposição de dados no servidor. Não será usado OCR ou serviço externo, pois o objetivo é código de barras e o ZXing já oferece essa decodificação.

### Separar falhas de câmera das falhas de detecção

O estado do modal distinguirá erro de obtenção de mídia, análise em progresso e código não encontrado. Erros transitórios da leitura contínua não encerrarão a sessão; apenas um resultado válido chama `onDetected` e encerra os controles de câmera. Isso evita que uma imagem sem código pareça falha de permissão.

### Extrair configuração e normalização testáveis

Formatos aceitos, restrições de câmera e normalização do texto retornado serão mantidos em unidade sem dependência do DOM para teste em Vitest. APIs de mídia e leitura efetiva serão verificadas manualmente em navegador mobile, pois a suíte atual usa ambiente Node e não simula câmera real.

## Risks / Trade-offs

- [Resolução alta consome mais bateria e pode não ser atendida pelo aparelho] → usar preferências (`ideal`) em vez de exigências e permitir que o navegador negocie a melhor câmera disponível.
- [Fotos grandes elevam uso de memória no navegador] → processar uma imagem por vez, mostrar estado de processamento e liberar a URL temporária imediatamente após a tentativa.
- [Uma foto continua podendo estar borrada, refletida ou com código pequeno] → manter a câmera contínua como alternativa e informar como refazer a captura.
- [Compatibilidade desigual de `capture`] → tratar o atributo como sugestão; o seletor de imagem permanece funcional em desktop e em navegadores que o ignorem.

## Migration Plan

1. Entregar a alteração somente no Client Component, sem migration de dados ou alteração de API.
2. Validar manualmente em Android e iOS com o EAN-13 `7897042013180`, imagem local e câmera traseira, além de um código não detectável e permissão negada.
3. Em caso de regressão, reverter o componente; produtos, códigos e dados persistidos não exigem recuperação.
