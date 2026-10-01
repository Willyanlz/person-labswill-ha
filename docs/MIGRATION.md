# Mapeamento do protótipo

Referências lidas integralmente antes da implementação: YAML original de 872 linhas
e briefing funcional. Nenhum nome, sensor ou serviço pessoal da referência é um default.

| Comportamento de origem | Nova arquitetura |
| --- | --- |
| swipe-card com três páginas e coverflow | `components/swipe-container.js`: scroll-snap, efeito CSS coverflow, toque, drag, teclado, loop opcional e indicadores |
| button-card quadrado, padding 0, raio 20 | `styles.js` e `appearance`, dimensões responsivas |
| Foto 65%, central e circular, fallback mdi:account | `profile-page.js`; também modos background e none |
| Barra superior clara, opacidade .85, raio 18 | Barra modular em profile; fundo segue o tema e aceita substituição |
| Localização, ringer, bateria com porcentagem, Bluetooth | `helpers.js`: valores, ícones e limites 30/50, cores configuráveis |
| Foto pequena, nome e quatro linhas de detalhes | `details-page.js`; nome dinâmico do person, carregamento normalizado |
| Textarea, Critical e Enviar | `notification-page.js`, estado reativo local, sem helpers |
| Título Central e notify mobile_app explícito | Serviço selecionado pelo usuário; payload normal/crítico compatível com o protótipo |
| Mensagem vazia, enviando, sucesso, erro | Validação, feedback acessível, bloqueio de envio duplo; sucesso limpa mensagem e Critical |
| Proteção dos inputs contra swipe e ações do button-card | Gestos iniciados em controles são ignorados pelo swipe; touch-action pan-y no formulário |
| Limpeza após envio e manutenção durante atualizações HA | Lit preserva DOM/estado; troca de pessoa reinicia o formulário para evitar envio ao destinatário errado |
| Atualizações de estados e ausência de sensores | Apenas entidades relevantes disparam atualização; estados desconhecidos neutros, sensores não configurados omitidos |

## Decisões técnicas

- Sem button-card, swipe-card, card-mod, stack-in-card ou notify-card. Lit é incluído
  no bundle, sem CDN ou instalação adicional no Home Assistant.
- Coverflow é uma implementação CSS própria; não é uma cópia pixel a pixel do Swiper.
- Removidos o timeout de 250 ms e o registro repetido de listeners do protótipo:
  lifecycle Lit e eventos declarativos garantem inicialização e limpeza.
- Estados ausentes não são apresentados como Bluetooth desligado ou bateria verde.
  Isso corrige informação enganosa sem retirar a função original.
- Perfil e detalhes ativos inicialmente; notificação exige serviço explícito.
- O clique padrão de mais informações do button-card é preservado na foto do perfil;
  o formulário não executa ações de clique/hold/double-tap do card ancestral.
