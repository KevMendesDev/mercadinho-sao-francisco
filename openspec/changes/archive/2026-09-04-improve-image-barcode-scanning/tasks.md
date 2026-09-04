## 1. Configuração de leitura

- [x] 1.1 Extrair para uma unidade testável os formatos de varejo, as dicas de decodificação, as restrições preferenciais da câmera e a normalização numérica; verificar com testes Vitest para EAN/UPC e texto com caracteres não numéricos.
- [x] 1.2 Atualizar `BarcodeScanner` para usar a configuração compartilhada, solicitar câmera traseira com resolução preferencial adequada e encerrar/liberar os controles em sucesso, fechamento e desmontagem; verificar `npm run typecheck`.

## 2. Leitura por imagem e feedback

- [x] 2.1 Adicionar ao modal a seleção de `image/*` com sugestão de captura traseira e decodificar o arquivo inteiramente no navegador, revogando a URL temporária em qualquer resultado; verificar manualmente que a foto fornecida retorna `7897042013180`.
- [x] 2.2 Implementar estados distintos para acesso à câmera, análise de imagem e código não reconhecido, mantendo a alternativa de imagem disponível após recusa de permissão; verificar manualmente os três estados em navegador mobile.
- [x] 2.3 Manter o contrato `onDetected` e validar nos fluxos de cadastro de produto e entrada de estoque que uma leitura preenche/consulta o mesmo código normalizado; verificar manualmente ambos os fluxos com um EAN-13 válido.

## 3. Verificação

- [x] 3.1 Adicionar testes unitários para configuração, normalização e classificação de falhas sem depender de APIs reais de câmera; verificar `npm test`.
- [x] 3.2 Executar `npm run lint`, `npm run typecheck` e `npm test`; registrar no PR a validação manual em Android e iOS para câmera traseira, imagem local, imagem sem código e permissão negada.
