import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { pageStyles } from '../styles.js';
import { cssValue } from '../helpers.js';
import './avatar.js';
export class ProfilePage extends LitElement {
  static properties = { config: {attribute:false}, model: {attribute:false} };
  static styles = [pageStyles, css`
    .profile{height:100%;position:relative;display:grid;place-items:center;overflow:hidden}
    .portrait{display:block;border:0;padding:0;background:transparent;width:var(--image-size,65%);aspect-ratio:1;border-radius:50%;overflow:hidden}
    .background{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;border-radius:0}
    .status{position:absolute;left:5%;width:90%;display:flex;align-items:center;justify-content:space-around;gap:4px;padding:8px 10px;isolation:isolate;pointer-events:none}
    .status::before{content:'';position:absolute;inset:0;background:var(--status-bg);opacity:var(--status-opacity);border-radius:inherit;z-index:-1}
    .item{display:inline-flex;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:24px;white-space:nowrap;font-size:13px}
    .item ha-icon{width:21px;height:21px;--mdc-icon-size:21px}
    .unavailable{position:absolute;bottom:8px;left:8px;font-size:11px;background:var(--card-background-color,#fff);border-radius:8px;padding:4px 8px}
  `];
  _moreInfo() { this.dispatchEvent(new CustomEvent('hass-more-info', {bubbles:true, composed:true, detail:{entityId:this.config.person}})); }
  render() {
    if (!this.model || !this.config) return nothing;
    const {image, status} = this.config.profile;
    const {model} = this;
    const rows = ['location','ringer','battery','bluetooth'].filter(key => status[`show_${key}`] && model.rows[key]);
    const background = cssValue('background-color', status.background, 'var(--card-background-color,#fff)');
    return html`<div class="profile">
      ${image.mode !== 'none' ? html`<button data-swipe-surface class=${`portrait ${image.mode === 'background' ? 'background' : ''}`}
        style=${styleMap({'--image-size':`${image.size}%`})} aria-label=${model.name} @click=${this._moreInfo}>
        <person-central-avatar .src=${model.image} .name=${model.name} .fit=${image.mode === 'background' ? 'cover' : image.object_fit}
          .position=${cssValue('object-position', image.background_position, 'center')}></person-central-avatar>
      </button>` : nothing}
      ${status.enabled && rows.length ? html`<div class="status" style=${styleMap({
        top:status.position === 'top' ? '14px' : 'auto', bottom:status.position === 'bottom' ? '14px' : 'auto',
        borderRadius:`${status.border_radius}px`, '--status-bg':background, '--status-opacity':status.opacity,
      })}>${rows.map(key => {const item=model.rows[key];return html`<span class="item" data-status=${key} title=${`${model.t(key)}: ${item.value}`} aria-label=${`${model.t(key)}: ${item.value}`} style=${styleMap({color:item.color})}>
        <ha-icon .icon=${item.icon}></ha-icon>${key === 'battery' ? html`<span>${item.value}</span>` : nothing}</span>`;})}</div>` : nothing}
      ${model.unavailable ? html`<span class="unavailable">${model.t('unavailable')}</span>` : nothing}
    </div>`;
  }
}
customElements.define('person-central-profile', ProfilePage);
