import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { normalize } from './config.js';
import { personModel, cssValue } from './helpers.js';
import { cardStyles } from './styles.js';
import './components/profile-page.js';
import './components/details-page.js';
import './components/notification-page.js';
import './components/swipe-container.js';
import './person-central-card-editor.js';

export class PersonCentralCard extends LitElement {
  static properties = { config:{attribute:false}, _revision:{state:true} };
  static styles = cardStyles;
  constructor() {
    super();this._revision=0;
    this._send=(service,payload)=>{
      const [domain,name]=service.split('.');
      if(domain!=='notify'||!name||!this._hass?.services?.notify?.[name]) return Promise.reject(new Error('Unavailable notify service'));
      return this._hass.callService(domain,name,payload);
    };
    // Keep events inside this card, including when embedded in dashboard swipe wrappers.
    for(const event of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend','touchcancel','mousedown','mousemove','mouseup','keydown','keyup','click','dblclick']) {
      this.addEventListener(event,e=>e.stopPropagation());
    }
  }
  setConfig(config) {this.config=normalize(config);this._tracked=null;}
  set hass(hass) {
    this._hass=hass;
    if(!this.config)return;
    const ids=[this.config.person,...Object.values(this.config.sensors)];
    const tracked=[...ids.map(id=>hass?.states?.[id]),hass?.services,hass?.locale?.language,hass?.language];
    if(!this._tracked||tracked.some((value,i)=>value!==this._tracked[i])) {this._tracked=tracked;this._revision++;}
  }
  get hass() {return this._hass;}
  static async getConfigElement() {
    // Ask HA to load its own editor controls; native fallback remains usable offline.
    try {
      const helpers=await window.loadCardHelpers?.();
      const card=await helpers?.createCardElement({type:'entities',entities:[]});
      await card?.constructor?.getConfigElement?.();
    } catch { /* Native controls in our editor remain available. */ }
    return document.createElement('person-central-card-editor');
  }
  static getStubConfig(hass) {return {person:Object.keys(hass?.states||{}).find(id=>id.startsWith('person.'))||''};}
  getCardSize() {return Math.ceil((this.config?.appearance.card_height || this.offsetWidth/(this.config?.appearance.aspect_ratio||1) || 350)/50);}
  getGridOptions() {return {columns:6,min_columns:3};}
  render() {
    if(!this.config)return nothing;
    const config=this.config, model=personModel(config,this._hass), a=config.appearance;
    const service=config.notification.notify_service.split('.')[1];
    return html`<ha-card style=${styleMap({
      '--person-radius':`${a.border_radius}px`, '--person-padding':`${a.padding}px`,
      '--person-height':a.card_height ? `${a.card_height}px` : 'auto', '--person-ratio':String(a.aspect_ratio),
      '--person-background':cssValue('background-color',a.background,'var(--ha-card-background,var(--card-background-color,#fff))'),
    })} aria-label=${model.name}>
      <person-central-swipe .pages=${config.page_order} .options=${config.swipe} .t=${model.t}>
        ${repeat(config.page_order,id=>id,id=>html`<section class="slide" data-page=${id} aria-label=${model.t(id)}>
          ${id==='profile' ? html`<person-central-profile .config=${config} .model=${model}></person-central-profile>`
            : id==='details' ? html`<person-central-details .config=${config} .model=${model}></person-central-details>`
              : html`<person-central-notification .config=${config} .model=${model} .available=${!!this._hass?.services?.notify?.[service]} .send=${this._send}></person-central-notification>`}
        </section>`)}
      </person-central-swipe>
    </ha-card>`;
  }
}
customElements.define('person-central-card',PersonCentralCard);
// Optional repository-name alias, with only the primary entry shown in the picker.
customElements.define('person-labswill-ha',class extends PersonCentralCard {});
window.customCards=window.customCards||[];
window.customCards.push({
  type:'person-central-card',name:'Person Central Card',preview:true,
  description:'Profile, device status and notifications for Home Assistant persons.',
  documentationURL:'https://github.com/Willyanlz/person-labswill-ha',
  getEntitySuggestion:(_hass,entityId)=>entityId?.startsWith('person.') ? {config:{type:'custom:person-central-card',person:entityId}} : null,
});
