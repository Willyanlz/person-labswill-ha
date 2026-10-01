# Mapeamento do protótipo

Referências lidas integralmente antes da implementação: YAML original de 872 linhas
e briefing funcional. Nenhum nome, sensor ou serviço pessoal da referência é um default.

| Comportamento de origem | Nova arquitetura |
| --- | --- |
| swipe-card com três páginas e coverflow | `components/swipe-container.js`: scroll-snap com transição horizontal, toque, drag, teclado, loop opcional e indicadores |
| button-card quadrado, padding 0, raio 20 | `styles.js` e `appearance`, dimensões responsivas |
| Foto 65%, central e circular, fallback mdi:account | `profile-page.js`; também modos background e none |
| Barra superior clara, opacidade .85, raio 18 | Barra modular em profile; fundo segue o tema e aceita substituição |
| Localização, ringer, bateria com porcentagem, Bluetooth | `helpers.js`: valores, ícones e limites 30/50, cores configuráveis |
| Foto pequena, nome e quatro linhas de detalhes | `details-page.js`; nome dinâmico do person, carregamento normalizado |
| Toque para abrir mapa da pessoa | `profile.open_more_info` controla o evento `hass-more-info` no card |
| Atualizações de estados e ausência de sensores | Apenas entidades relevantes disparam atualização; estados desconhecidos neutros, sensores não configurados omitidos |

## Decisões técnicas

- Sem button-card, swipe-card, card-mod, stack-in-card ou notify-card. Lit é incluído
  no bundle, sem CDN ou instalação adicional no Home Assistant.
- A transição padrão é um slide horizontal simples com CSS scroll-snap; o efeito 3D coverflow foi removido por não ficar legível no card compacto.
- Removidos o timeout de 250 ms e o registro repetido de listeners do protótipo:
  lifecycle Lit e eventos declarativos garantem inicialização e limpeza.
- Estados ausentes não são apresentados como Bluetooth desligado ou bateria verde.
  Isso corrige informação enganosa sem retirar a função original.
- Perfil e informações ativas inicialmente; mapa abre por toque por padrão e pode ser desativado no editor.
- A página de notificação foi removida: este card agora se concentra em perfil, sensores e mapa da pessoa.
- O clique padrão de mais informações do button-card é preservado na foto do perfil;
  o formulário não executa ações de clique/hold/double-tap do card ancestral.
