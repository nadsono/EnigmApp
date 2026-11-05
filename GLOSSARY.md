# Enigma Gestão

Vocabulário comum para as operações registradas no Enigma. Os termos separam pessoas, contas operacionais, custódia de ativos e movimentações para que telas e dados usem o mesmo significado.

## Operação e relacionamento

**Parceria**:
Registro do vínculo operacional com um titular, incluindo atribuição, custos e as contas de casas associadas.
_Evitar_: conta, usuário.

**Titular**:
Pessoa cujos dados cadastrais estão associados a uma parceria.
_Evitar_: operador, usuário.

**Casa**:
Plataforma onde uma conta operacional pode existir.
_Evitar_: parceria, corretora.

**Grupo de clones**:
Classificação operacional que agrupa casas relacionadas para organizar contas e operações.
_Evitar_: casa, corretora.

**Conta de casa**:
Conta de acesso mantida em uma casa e associada a uma parceria.
_Evitar_: carteira, usuário.

**Entrada**:
Registro de uma operação de apostas, que pode reunir uma ou mais pernas e ter apuração e conciliação em etapas distintas.
_Evitar_: depósito, lançamento de saldo.

**Perna**:
Parte individual de uma entrada, com casa, seleção, odd, stake e resultado próprios.
_Evitar_: entrada, saque.

## Ativos e movimentações

**Corretora**:
Instituição ou plataforma de custódia que mantém contas e saldos de ativos digitais.
_Evitar_: casa, banco, carteira.

**Carteira**:
Meio de custódia ou controle de ativos digitais; pode ser custodial (gerida por uma plataforma) ou autocustodial.
_Evitar_: conta de casa, endereço.

**Ativo**:
Moeda ou token identificado separadamente da rede em que pode ser transferido.
_Evitar_: ticker como identificador único.

**Rede**:
Blockchain usada para movimentar um ativo; define uma rota de transferência que precisa corresponder à origem e ao destino.
_Evitar_: ativo, corretora.

**Destino financeiro**:
Conta ou endereço autorizado a receber uma transferência.
_Evitar_: chave privada, carteira (quando se quer dizer o endereço de recebimento).

**Cotação aplicada**:
Taxa de conversão efetivamente usada em um lançamento, com par de ativos, origem e horário registrados.
_Evitar_: cotação atual, valor aproximado.

**Movimento de razão**:
Evento financeiro que registra entrada, saída, reserva, liquidação, taxa, ajuste ou estorno em uma conta de ativo.
_Evitar_: saldo editado, ajuste sem histórico.

**Conciliação**:
Comparação entre o saldo esperado pelos movimentos registrados e o saldo observado na fonte externa.
_Evitar_: apuração do resultado de uma entrada.

**Saque**:
Movimentação solicitada a partir de uma conta de casa para um destino financeiro, com etapas de envio, trânsito e recebimento.
_Evitar_: transferência bancária (quando a rota usa cripto).
