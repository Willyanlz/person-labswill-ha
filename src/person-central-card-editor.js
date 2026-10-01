import { LitElement, html, css, nothing } from 'lit';
import { normalize, enabledPages, PAGE_IDS } from './config.js';
const names={profile:'Perfil',details:'Informações'};
const get=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
export class PersonCentralCardEditor extends LitElement {
  static properties={hass:{attribute:false},config:{attribute:false},_error:{state:true}};
  static styles=css`
    :host{display:block;color:var(--primary-text-color,#202124)} *{box-sizing:border-box}
    details{border-bottom:1px solid var(--divider-color,#ddd);padding:10px 0} summary{cursor:pointer;font-weight:600;padding:8px 0}
    .field{display:flex;flex-direction:column;gap:6px;margin:12px 0;font-size:14px} .toggle{flex-direction:row;justify-content:space-between;align-items:center;min-height:32px}
    input:not([type=checkbox]),select{width:100%;min-height:40px;padding:8px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--card-background-color,#fff);color:inherit;font:inherit}
    input[type=checkbox]{width:22px;height:22px;accent-color:var(--primary-color,#03a9f4)}
    .page-row{display:flex;align-items:center;gap:8px}.page-row>span{flex:1}
    button{min-width:36px;min-height:36px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:transparent;color:inherit;cursor:pointer}
    button:disabled{opacity:.3;cursor:default}.hint{font-size:12px;color:var(--secondary-text-color,#666)}
    .error{color:var(--error-color,#db4437);font-size:13px;overflow-wrap:anywhere} .preview{display:flex;align-items:center;gap:8px;font-weight:600;margin:8px 0}
    input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}
  `;
  setConfig(config) {this.config=structuredClone(config);}
  _emit(config) {
    this.config=config;
    try {normalize(config);this._error='';} catch(error) {this._error=error.message;}
    this.dispatchEvent(new CustomEvent('config-changed',{bubbles:true,composed:true,detail:{config:structuredClone(config)}}));
  }
  _set(path,value) {
    const config=structuredClone(this.config||{}), keys=path.split('.');
    let current=config;
    for(const key of keys.slice(0,-1))current=current[key]??={};
    if(value===undefined||value==='')delete current[keys.at(-1)];else current[keys.at(-1)]=value;
    if(/^pages\.[^.]+\.enabled$/.test(path)) {
      const enabled=enabledPages(normalize(config,false));
      const previous=this.config?.page_order||enabledPages(normalize(this.config,false));
      config.page_order=[...previous.filter(id=>enabled.includes(id)),...enabled.filter(id=>!previous.includes(id))];
      // Remove legacy page.enabled so there is one source of truth after visual edits.
      const id=keys[1];if(config[id])delete config[id].enabled;
    }
    this._emit(config);
  }
  _move(id,delta) {
    const config=structuredClone(this.config), order=[...this._c.page_order], index=order.indexOf(id),next=index+delta;
    if(next<0||next>=order.length)return;
    [order[index],order[next]]=[order[next],order[index]];config.page_order=order;this._emit(config);
  }
  _toggle(path,label) {return html`<label class="field toggle"><span>${label}</span><input type="checkbox" data-path=${path} .checked=${!!get(this._c,path)} @change=${e=>this._set(path,e.target.checked)}></label>`;}
  _text(path,label,type='text',min=undefined,max=undefined,step=1) {
    return html`<label class="field"><span>${label}</span><input data-path=${path} type=${type} .value=${String(get(this._c,path)??'')}
      min=${min??nothing} max=${max??nothing} step=${step} @input=${e=>this._set(path,type==='number' ? e.target.value===''?undefined:Number(e.target.value) : e.target.value)}></label>`;
  }
  _select(path,label,options) {return html`<label class="field"><span>${label}</span><select data-path=${path} .value=${get(this._c,path)} @change=${e=>this._set(path,e.target.value)}>
    ${options.map(([value,text])=>html`<option value=${value} .selected=${get(this._c,path)===value}>${text}</option>`)}</select></label>`;}
  _entity(path,label,person=false) {
    const value=get(this._c,path)||'';
    if(customElements.get('ha-selector')) return html`<div class="field"><ha-selector data-path=${path} .hass=${this.hass}
      .selector=${{entity:person?{filter:{domain:'person'}}:{}}} .value=${value}
      .label=${label} @value-changed=${e=>{e.stopPropagation();this._set(path,e.detail.value);}}></ha-selector></div>`;
    const ids=Object.keys(this.hass?.states||{}).filter(id=>!person||id.startsWith('person.'));
    if(value&&!ids.includes(value))ids.unshift(value);
    return html`<label class="field"><span>${label}</span><select data-path=${path} .value=${value} @change=${e=>this._set(path,e.target.value)}>
      <option value="" .selected=${!value}>Selecionar…</option>${ids.map(id=>html`<option value=${id} .selected=${value===id}>${this.hass?.states?.[id]?.attributes?.friendly_name||id} (${id})</option>`)}</select></label>`;
  }
  render() {
    if(!this.config)return nothing;
    this._c=normalize(this.config,false);
    const c=this._c,p=c.profile;
    return html`<p class="hint">Person Central Card · LabsWill</p>
      ${this._error?html`<p class="error" role="alert">${this._error}</p>`:nothing}
      <details open><summary>Pessoa</summary>${this._entity('person','Entidade da pessoa',true)}
        <div class="preview">${this.hass?.states?.[c.person]?.attributes?.friendly_name||'Selecione uma pessoa para visualizar o card.'}</div>
        ${this._select('language','Idioma',[['pt','Português'],['en','Inglês'],['auto','Idioma do Home Assistant']])}</details>
      <details open><summary>Páginas</summary>${PAGE_IDS.map(id=>this._toggle(`pages.${id}.enabled`,names[id]))}
        <p class="hint">Use as setas para ordenar as páginas habilitadas.</p>
        ${c.page_order.map((id,index)=>html`<div class="page-row"><span>${names[id]}</span><button type="button" aria-label=${`Subir ${names[id]}`} ?disabled=${index===0} @click=${()=>this._move(id,-1)}>↑</button><button type="button" aria-label=${`Descer ${names[id]}`} ?disabled=${index===c.page_order.length-1} @click=${()=>this._move(id,1)}>↓</button></div>`)}
        ${this._toggle('swipe.enabled','Permitir swipe')}${this._toggle('swipe.show_indicators','Indicadores de página')}${this._toggle('swipe.loop','Navegação circular')}
      </details>
      ${c.pages.profile.enabled?html`<details><summary>Perfil</summary>
        ${this._toggle('profile.open_more_info','Abrir mapa')}
        ${this._select('profile.image.mode','Modo da imagem',[['circle','Redonda'],['background','Fundo'],['none','Nenhuma']])}
        ${p.image.mode==='circle'?html`${this._text('profile.image.size','Tamanho da imagem (%)','number',10,100)}${this._select('profile.image.object_fit','Ajuste',[['cover','Preencher'],['contain','Imagem inteira']])}`:nothing}
        ${p.image.mode==='background'?this._text('profile.image.background_position','Posição do fundo (ex.: center top)'):nothing}
      </details><details><summary>Status</summary>${this._toggle('profile.status.enabled','Mostrar barra de status')}
        ${p.status.enabled?html`${this._toggle('profile.status.show_location','Localização')}${this._toggle('profile.status.show_ringer','Modo do celular')}${this._toggle('profile.status.show_battery','Bateria')}${this._toggle('profile.status.show_bluetooth','Bluetooth')}
          ${this._select('profile.status.position','Posição',[['top','Acima'],['bottom','Abaixo']])}${this._text('profile.status.background','Fundo (auto ou cor CSS)')}${this._text('profile.status.border_radius','Raio da barra','number',0,100)}${this._text('profile.status.opacity','Opacidade do fundo','number',0,1,.05)}`:nothing}
      </details>`:nothing}
      <details><summary>Sensores</summary><p class="hint">Opcionais. Para exibir na barra, habilite também o indicador em Status.</p>
        ${this._entity('sensors.battery','Bateria')}${this._entity('sensors.battery_state','Estado da bateria')}${this._entity('sensors.ringer','Modo do celular')}${this._entity('sensors.bluetooth','Bluetooth')}</details>
      ${c.pages.details.enabled?html`<details><summary>Informações</summary>${[['image','Foto'],['name','Nome'],['location','Localização'],['battery','Bateria'],['battery_state','Estado da bateria'],['ringer','Modo do celular'],['bluetooth','Bluetooth']].map(([key,label])=>this._toggle(`details.show_${key}`,label))}</details>`:nothing}
      <details><summary>Aparência</summary>${this._text('appearance.border_radius','Raio dos cantos (px)','number',0,100)}${this._text('appearance.card_height','Altura fixa opcional (px)','number',180,1600)}
        ${this._text('appearance.aspect_ratio','Proporção largura/altura','number',.4,3,.1)}${this._text('appearance.background','Fundo (auto ou cor CSS)')}${this._text('appearance.padding','Espaçamento interno (px)','number',0,100)}</details>`;
  }
}
customElements.define('person-central-card-editor',PersonCentralCardEditor);
