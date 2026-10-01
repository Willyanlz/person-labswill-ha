import { LitElement, html, css, nothing } from 'lit';
import { pageStyles } from '../styles.js';
import './avatar.js';
export class DetailsPage extends LitElement {
  static properties = { config: {attribute:false}, model: {attribute:false} };
  static styles = [pageStyles, css`
    .rows{display:grid;grid-template-columns:24px minmax(0,1fr);gap:clamp(10px,4cqw,18px) 14px;align-items:center}
    .value{font-size:16px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
    .muted{margin-bottom:3px}
  `];
  render() {
    if (!this.model) return nothing;
    const d = this.config.details, m=this.model;
    const rows = ['location', 'battery', 'battery_state', 'ringer', 'bluetooth'].filter(key => d[`show_${key}`] && m.rows[key]);
    const combined = rows.includes('battery') && rows.includes('battery_state');
    return html`<div class="page"><section class="panel">
      ${d.show_image ? html`<person-central-avatar class="avatar" .src=${m.image} .name=${m.name}></person-central-avatar>` : nothing}
      ${d.show_name ? html`<h2>${m.name}</h2>` : nothing}
      <div class="rows">${rows.filter(key => !combined || key !== 'battery_state').map(key => html`
        <ha-icon .icon=${key === 'location' ? 'mdi:map-marker' : m.rows[key].icon}></ha-icon>
        <div data-detail=${key}><div class="muted">${m.t(key)}</div><div class="value">${m.rows[key].value}${key === 'battery' && combined ? ` • ${m.rows.battery_state.value}` : ''}</div></div>
      `)}</div>
    </section></div>`;
  }
}
customElements.define('person-central-details', DetailsPage);
