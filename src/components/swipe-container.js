import { LitElement, html, css, nothing } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
const interactive = event => event.composedPath().some(el => el?.matches?.('input,textarea,button:not([data-swipe-surface]),select,label,[contenteditable=true]'));
export class SwipeContainer extends LitElement {
  static properties = { pages:{attribute:false}, options:{attribute:false}, t:{attribute:false}, index:{state:true} };
  static styles = css`
    :host{display:block;height:100%;min-width:0} *{box-sizing:border-box}
    .shell{display:flex;flex-direction:column;height:100%;min-height:0}
    .viewport{display:flex;flex:1;min-height:0;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;touch-action:pan-y;outline-offset:-3px}
    .viewport::-webkit-scrollbar{display:none} .viewport.disabled{overflow:hidden;touch-action:pan-y}
    .viewport.control-touch{overflow-x:hidden;scroll-snap-type:none;touch-action:pan-y}
    .viewport.dragging{scroll-snap-type:none;cursor:grabbing;user-select:none}
    ::slotted(*){flex:0 0 100%;width:100%;height:100%;min-width:0;scroll-snap-align:start;scroll-snap-stop:always}
    nav{display:flex;align-items:center;justify-content:center;gap:4px;flex:0 0 32px;padding:0 6px}
    button{min-width:32px;min-height:32px;border:0;background:transparent;color:var(--secondary-text-color,#666);cursor:pointer;border-radius:10px;font:inherit}
    button:focus-visible,.viewport:focus-visible{outline:2px solid var(--primary-color,#03a9f4)}
    button:disabled{opacity:.35;cursor:default} .dot::before{content:'';display:block;margin:auto;width:6px;height:6px;border-radius:50%;background:var(--divider-color,#aaa)}
    .dot[aria-current=true]::before{background:var(--primary-color,#03a9f4);width:14px;border-radius:4px}
  `;
  constructor() {
    super();this.pages=[];this.index=0;this.viewport=createRef();this._raf=0;this._controlTouch=null;
    this.addEventListener('click',event=>{
      if(Date.now()<this._ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation();}
    },true);
  }
  connectedCallback() {super.connectedCallback();this._observer=new ResizeObserver(()=>this.go(this.index,false));this._observer.observe(this);}
  disconnectedCallback() {super.disconnectedCallback();this._observer?.disconnect();cancelAnimationFrame(this._raf);this._drag=null;this._touch=null;this._controlTouch=null;}
  updated(changed) {
    if (changed.has('pages')) {
      const old=changed.get('pages') || [];
      this.go(Math.max(0,this.pages.indexOf(old[this.index])),false);
    }
    if (changed.has('options')) this._effects();
  }
  go(index, smooth=true) {
    const count=this.pages.length;
    if (!count) return;
    this.index=this.options?.loop ? (index+count)%count : Math.max(0,Math.min(count-1,index));
    const viewport=this.viewport.value;
    if (viewport) viewport.scrollTo({left:this.index*viewport.clientWidth,behavior:smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'});
    this._effects();
  }
  _effects() {
    const viewport=this.viewport.value;
    if (!viewport?.clientWidth) return;
    const progress=viewport.scrollLeft/viewport.clientWidth;
    const slides=[...this.children];
    slides.forEach((slide,index)=>{
      const distance=Math.min(1,Math.abs(index-progress));
      slide.style.opacity=String(1-distance*.2);
      slide.style.transform=`scale(${1-distance*.025})`;
      slide.inert=index!==this.index;
      slide.setAttribute('aria-hidden',String(index!==this.index));
    });
  }
  _scroll() {
    cancelAnimationFrame(this._raf);
    this._raf=requestAnimationFrame(()=>{
      const view=this.viewport.value;
      if (!view?.clientWidth) return;
      const next=Math.round(view.scrollLeft/view.clientWidth);
      if (next!==this.index && next<this.pages.length) this.index=next;
      this._effects();
    });
  }
  _down(event) {
    if (event.pointerType!=='mouse' || event.button!==0 || interactive(event) || !this.options.enabled || this.pages.length<2) return;
    this._drag={id:event.pointerId,x:event.clientX,start:this.viewport.value.scrollLeft,index:this.index};
    this.viewport.value.setPointerCapture(event.pointerId);
    this.viewport.value.classList.add('dragging');
  }
  _move(event) {if(this._drag) this.viewport.value.scrollLeft=this._drag.start+this._drag.x-event.clientX;}
  _up(event) {
    if(!this._drag) return;
    const drag=this._drag;this._drag=null;
    this.viewport.value.classList.remove('dragging');
    if(this.viewport.value.hasPointerCapture(drag.id)) this.viewport.value.releasePointerCapture(drag.id);
    const dx=drag.x-event.clientX;
    if(Math.abs(dx)>40)this._ignoreClickUntil=Date.now()+400;
    this.go(Math.abs(dx)>40 ? drag.index+(dx>0?1:-1) : drag.index);
  }
  _touchStart(event) {
    this._touch=null;
    if(interactive(event)){
      const touch=event.touches[0];
      this._controlTouch={x:touch.clientX,y:touch.clientY,scrollLeft:this.viewport.value?.scrollLeft||0,index:this.index};
      this.viewport.value?.classList.add('control-touch');
      return;
    }
    this._controlTouch=null;
    if(!this.options.enabled||this.pages.length<2||event.touches.length!==1)return;
    this._touch={x:event.touches[0].clientX,y:event.touches[0].clientY,index:this.index};
  }
  _touchMove(event) {
    if(!this._controlTouch||event.touches.length!==1)return;
    const touch=event.touches[0],dx=touch.clientX-this._controlTouch.x,dy=touch.clientY-this._controlTouch.y;
    if(Math.abs(dx)>Math.abs(dy)){
      if(event.cancelable)event.preventDefault();
      if(this.viewport.value)this.viewport.value.scrollLeft=this._controlTouch.scrollLeft;
    }
  }
  _touchEnd(event) {
    const control=this._controlTouch;
    this._controlTouch=null;
    this.viewport.value?.classList.remove('control-touch');
    if(control){this.go(control.index,false);return;}
    const start=this._touch;this._touch=null;
    if(!start||!event.changedTouches.length)return;
    const dx=start.x-event.changedTouches[0].clientX,dy=start.y-event.changedTouches[0].clientY;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){this._ignoreClickUntil=Date.now()+400;this.go(start.index+(dx>0?1:-1));}
  }
  _key(event) {
    if(interactive(event)||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();this.go(this.index+(event.key==='ArrowRight'?1:-1));
  }
  render() {
    const multiple=this.pages.length>1, t=this.t || (x=>x);
    return html`<div class="shell"><div ${ref(this.viewport)} class=${`viewport ${!multiple||!this.options?.enabled?'disabled':''}`} tabindex="0" role="region" aria-label="Person Central"
      @scroll=${this._scroll} @keydown=${this._key} @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up}
      @pointercancel=${() => {this._drag=null;this.viewport.value?.classList.remove('dragging');this.go(this.index,false);}}
      @touchstart=${this._touchStart} @touchmove=${this._touchMove} @touchend=${this._touchEnd} @touchcancel=${()=>{this._touch=null;this._controlTouch=null;this.viewport.value?.classList.remove('control-touch');}}><slot></slot></div>
      ${multiple&&this.options.show_indicators ? html`<nav aria-label="Páginas">${this.pages.map((id,i)=>html`<button class="dot" aria-label=${t(id)} aria-current=${String(i===this.index)} @click=${()=>this.go(i)}></button>`)}</nav>` : nothing}
    </div>`;
  }
}
customElements.define('person-central-swipe', SwipeContainer);
