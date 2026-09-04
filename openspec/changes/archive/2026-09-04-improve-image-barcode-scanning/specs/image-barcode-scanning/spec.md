## Purpose

Permitir que operadores leiam códigos de barras de varejo de forma confiável pela câmera do telefone ou a partir de uma imagem local, sem transferir a imagem para o servidor.

## ADDED Requirements

### Requirement: Leitura de código pela câmera traseira

O sistema SHALL abrir a câmera traseira quando ela estiver disponível e solicitar uma resolução adequada à leitura de códigos lineares. Durante a sessão, o sistema SHALL tentar reconhecer EAN-13, EAN-8, UPC-A, UPC-E, CODE-128 e ITF; ao reconhecer um código, SHALL encerrar a captura e retornar somente seus dígitos ao formulário que abriu o leitor.

#### Scenario: EAN-13 é reconhecido pela câmera

- **WHEN** o operador enquadra um EAN-13 legível pela câmera traseira
- **THEN** o sistema encerra a câmera e entrega os 13 dígitos reconhecidos ao formulário

#### Scenario: Câmera traseira não está disponível

- **WHEN** o dispositivo não disponibiliza uma câmera traseira
- **THEN** o sistema usa uma câmera disponível sem impedir a leitura

### Requirement: Leitura de código por imagem local

O sistema SHALL permitir que o operador selecione uma imagem local ou use a captura de foto do dispositivo e SHALL analisá-la inteiramente no navegador. Ao reconhecer um dos formatos suportados, SHALL retornar somente os dígitos do código ao formulário; a imagem SHALL NOT ser enviada nem persistida pelo sistema.

#### Scenario: Fotografia contém EAN-13 legível

- **WHEN** o operador seleciona uma foto que contém o EAN-13 `7897042013180`
- **THEN** o sistema retorna `7897042013180` ao formulário que abriu o leitor

#### Scenario: Imagem não contém código legível

- **WHEN** o operador seleciona uma imagem sem código suportado ou legível
- **THEN** o sistema mantém o leitor aberto e informa que a leitura não foi possível, orientando nova foto ou tentativa pela câmera

### Requirement: Feedback distinguível de captura e detecção

O sistema SHALL informar separadamente falhas de permissão/indisponibilidade da câmera e falhas de reconhecimento de código. O sistema SHALL oferecer um estado de processamento enquanto uma imagem selecionada estiver sendo analisada e SHALL permitir que o operador feche o leitor a qualquer momento.

#### Scenario: Permissão da câmera é negada

- **WHEN** o navegador nega o acesso à câmera
- **THEN** o sistema informa a falha de acesso e mantém disponível a seleção de imagem local

#### Scenario: Imagem está em análise

- **WHEN** o operador seleciona uma imagem para leitura
- **THEN** o sistema indica que a imagem está sendo analisada até obter resultado ou falha de detecção
