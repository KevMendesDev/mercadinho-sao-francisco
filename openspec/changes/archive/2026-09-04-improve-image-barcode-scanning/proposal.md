## Why

O leitor atual usa somente o fluxo contínuo da câmera com as restrições padrão do navegador. Na prática, códigos EAN-13 legíveis em uma fotografia — como `7897042013180` da imagem fornecida — deixam de ser detectados, pois não há resolução mínima, tentativa mais tolerante nem opção de enviar uma foto para decodificação.

## What Changes

- Melhorar a captura pela câmera traseira, solicitando resolução adequada para códigos lineares e aplicando dicas de decodificação para EAN/UPC.
- Permitir escolher uma imagem do dispositivo ou tirar uma foto para que o mesmo leitor a analise localmente.
- Exibir estado de leitura e uma mensagem acionável quando a imagem não contiver um código suportado, sem confundir essa condição com erro de permissão da câmera.
- Preservar a normalização numérica e os fluxos atuais de consulta/cadastro após uma leitura bem-sucedida.
- Cobrir a configuração de formatos e os resultados de leitura/erro com testes automatizados.

## Capabilities

### New Capabilities

- `image-barcode-scanning`: Leitura confiável de códigos de barras de varejo pela câmera ou por imagem local, com retorno normalizado ao formulário chamador.

### Modified Capabilities

- None.

## Impact

- Código afetado: `src/components/ui/BarcodeScanner.tsx` e os consumidores em cadastro de produto e entrada de estoque.
- Dependência afetada: uso configurado de `@zxing/browser`; não é prevista integração externa nem envio da imagem ao servidor.
- UX afetada: o modal do leitor passará a oferecer análise de foto e feedback específico para falha de detecção.
