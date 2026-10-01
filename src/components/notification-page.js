import { LitElement, html, css, nothing } from 'lit';
import { pageStyles } from '../styles.js';
export class NotificationPage extends LitElement {
  static properties = { config:{attribute:false}, model:{attribute:false}, send:{attribute:false}, available:{type:Boolean},
    message:{state:true}, critical:{state:true}, status:{state:true}, feedback:{state:true} };
  static styles = [pageStyles, css`
    .panel{touch-action:pan-y} header{text-align:center} header ha-icon{width:30px;height:30px;--mdc-icon-size:30px;margin-bottom:8px}
    h2{margin-bottom:4px} .subtitle{margin:0 0 18px;text-align:center}
    textarea{display:block;width:100%;min-height:86px;resize:vertical;padding:14px;border:1px solid var(--divider-color,#ddd);border-radius:14px;background:var(--input-fill-color,var(--secondary-background-color,#eee));color:inherit;font-size:15px;line-height:1.4;touch-action:pan-y;user-select:text}
    label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0;min-height:36px;font-size:14px}
    label span{display:flex;align-items:center;gap:10px} input{width:22px;height:22px;accent-color:var(--primary-color,#03a9f4)}
    button{display:block;width:100%;margin-top:16px;padding:13px 16px;border:0;border-radius:14px;min-height:44px;background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);font-weight:600}
    button:disabled{opacity:.6;cursor:wait} .feedback{font-size:12px;min-height:18px;margin-top:9px;text-align:center;overflow-wrap:anywhere}
    .error{color:var(--error-color,#db4437)} .success{color:var(--success-color,#50a14f)}
    .message-label{display:block;margin:0 0 6px;min-height:0}
  `];
  constructor() { super(); this.message='';this.critical=false;this.status='idle';this.feedback='';this._request=0; }
  willUpdate(changed) {
    const old = changed.get('config');
    if (changed.has('config') && (!old || old.person !== this.config.person || old.notification.notify_service !== this.config.notification.notify_service)) {
      this._request++;this.message='';this.critical=this.config.notification.critical.default;this.status='idle';this.feedback='';
    }
    if (!this.config.notification.critical.enabled) this.critical=false;
  }
  disconnectedCallback() { super.disconnectedCallback(); this._request++; if (this.status==='sending') {this.status='idle';this.feedback='';} }
  async _submit(event) {
    event.preventDefault();event.stopPropagation();
    if (this.status === 'sending') return;
    const t = this.model.t, message = this.message.trim();
    if (!message) {this.status='error';this.feedback=t('empty');return;}
    if (!this.available) {this.status='error';this.feedback=t('missing_service');return;}
    const n = this.config.notification;
    const payload = {title:n.title,message};
    if (n.critical.enabled && this.critical) payload.data={push:{sound:{name:'default',critical:1,volume:n.critical.volume}}};
    const request=++this._request;
    this.status='sending';this.feedback=t('sending');
    try {
      await this.send(n.notify_service, payload);
      if (request !== this._request) return;
      this.message='';this.critical=false;this.status='success';this.feedback=t('success');
    } catch {
      if (request !== this._request) return;
      this.status='error';this.feedback=t('error');
    }
  }
  render() {
    if (!this.model || !this.config) return nothing;
    const t=this.model.t, busy=this.status==='sending';
    return html`<div class="page"><form class="panel" @submit=${this._submit}>
      <header><ha-icon icon="mdi:bell-outline"></ha-icon><h2>${t('notification')}</h2></header>
      <p class="muted subtitle">${t('send_to')} ${this.model.name}</p>
      <label class="message-label muted" for="message">${t('message')}</label>
      <textarea id="message" .value=${this.message} ?disabled=${busy} placeholder=${t('placeholder')}
        @input=${event => {this.message=event.target.value;this.status='idle';this.feedback='';}}></textarea>
      ${this.config.notification.critical.enabled ? html`<label><span><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${t('critical')}</span>
        <input type="checkbox" .checked=${this.critical} ?disabled=${busy} @change=${e => {this.critical=e.target.checked;}}></label>` : nothing}
      ${!this.available ? html`<p class="muted">${t('missing_service')}</p>` : nothing}
      <button type="submit" ?disabled=${busy} aria-busy=${String(busy)}>${busy ? t('sending') : this.status==='success' ? t('sent') : this.status==='error' ? t('error') : t('send')}</button>
      <div class=${`feedback ${this.status}`} role="status" aria-live="polite">${this.feedback}</div>
    </form></div>`;
  }
}
customElements.define('person-central-notification', NotificationPage);
