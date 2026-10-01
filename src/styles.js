import { css } from 'lit';
export const pageStyles = css`
  :host{display:block;height:100%;min-width:0;color:var(--primary-text-color,#202124);font-family:inherit}
  *{box-sizing:border-box} [hidden]{display:none!important}
  ha-icon{display:inline-flex;width:24px;height:24px;--mdc-icon-size:24px;flex-shrink:0}
  button,input,textarea{font:inherit;color:inherit} button{cursor:pointer}
  button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--primary-color,#03a9f4);outline-offset:3px}
  .panel{width:84%;max-width:560px;margin:auto;padding:clamp(12px,5cqw,24px);border-radius:20px;background:color-mix(in srgb,var(--primary-text-color,#202124) 5%,transparent);backdrop-filter:blur(6px)}
  .page{height:100%;overflow-y:auto;overscroll-behavior:contain;display:flex;padding:12px 0;container-type:inline-size}
  .avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px}
  .fallback{display:grid;place-items:center;background:var(--secondary-background-color,#eee);color:var(--secondary-text-color,#888)}
  .fallback ha-icon{width:60%;height:60%;--mdc-icon-size:100%}
  h2{font-size:clamp(18px,6cqw,22px);line-height:1.25;text-align:center;margin:0 0 18px;overflow-wrap:anywhere}
  .muted{color:var(--secondary-text-color,#666);font-size:12px}
`;
export const cardStyles = css`
  :host{display:block;min-width:0}
  ha-card{display:block;overflow:hidden;box-sizing:border-box;color:var(--primary-text-color,#202124);background:var(--person-background,var(--ha-card-background,var(--card-background-color,#fff)));border-radius:var(--person-radius,20px);padding:var(--person-padding,0);height:var(--person-height,auto);aspect-ratio:var(--person-ratio,1);container-type:inline-size}
  person-central-swipe{height:100%;display:block;min-width:0}
  .slide{flex:0 0 100%;min-width:0;height:100%;scroll-snap-align:start;scroll-snap-stop:always;box-sizing:border-box;transform-origin:center;transition:opacity .15s}
  .slide>*{height:100%;display:block}
`;
