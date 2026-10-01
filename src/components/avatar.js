import { LitElement, html, css } from 'lit';
import { pageStyles } from '../styles.js';
export class Avatar extends LitElement {
  static properties = { src: {}, name: {}, fit: {}, position: {}, _failed: {state:true} };
  static styles = [pageStyles, css`
    :host{display:block;width:100%;height:100%;overflow:hidden;border-radius:inherit}
    img,.fallback{display:block;width:100%;height:100%;margin:0;border-radius:inherit}
    .fallback{display:grid}
  `];
  willUpdate(changes) { if (changes.has('src')) this._failed = false; }
  render() {
    return this.src && !this._failed ? html`<img src=${this.src} alt=${this.name || ''}
      style=${`object-fit:${this.fit || 'cover'};object-position:${this.position || 'center'}`}
      @error=${() => {this._failed = true;}}>` : html`<div class="fallback" role="img" aria-label=${this.name || ''}><ha-icon icon="mdi:account"></ha-icon></div>`;
  }
}
customElements.define('person-central-avatar', Avatar);
