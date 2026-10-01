import { test, expect } from '@playwright/test';
async function mount(page, config={}) {
  await page.goto('/');
  await page.addStyleTag({content:':root{--primary-text-color:#192b3a;--secondary-text-color:#64748b;--card-background-color:#fff;--secondary-background-color:#edf2f7;--primary-color:#0284c7;--text-primary-color:white;--divider-color:#dbe3eb}body{margin:20px;background:#f1f5f9;font:16px system-ui}person-central-card{display:block;width:min(400px,100%)}ha-icon{display:inline-block}'});
  await page.addScriptTag({type:'module',url:'/dist/person-central-card.js'});
  await page.evaluate(async config=>{
    await customElements.whenDefined('person-central-card');
    window.calls=[];
    window.hass={locale:{language:'pt-BR'},states:{
      'person.example':{state:'home',attributes:{friendly_name:'Alex'}},
      'person.other':{state:'not_home',attributes:{friendly_name:'Sam'}},
      'sensor.battery':{state:'85',attributes:{}},'sensor.charge':{state:'Charging',attributes:{}},
      'sensor.ringer':{state:'vibrate',attributes:{}},'binary_sensor.bluetooth':{state:'on',attributes:{}},
    },services:{notify:{mobile_app_example:{name:'Telefone de exemplo'}}},callService:async(...args)=>{window.calls.push(args);}};
    window.card=document.createElement('person-central-card');
    card.setConfig({person:'person.example',...config});card.hass=hass;document.body.append(card);await card.updateComplete;
  },config);
  await expect(page.locator('ha-card')).toBeVisible();
}
const full={pages:{profile:{enabled:true},details:{enabled:true},notification:{enabled:true}},sensors:{battery:'sensor.battery',battery_state:'sensor.charge',ringer:'sensor.ringer',bluetooth:'binary_sensor.bluetooth'},profile:{status:{show_battery:true,show_ringer:true,show_bluetooth:true}},notification:{notify_service:'notify.mobile_app_example'}};
async function go(page,id){
  const dot=page.locator(`person-central-swipe .dot[aria-label="${id}"]`);
  const viewport=page.locator('person-central-swipe .viewport');
  await dot.click();await expect(dot).toHaveAttribute('aria-current','true');
  const target=await dot.evaluate(el=>[...el.parentElement.querySelectorAll('.dot')].indexOf(el));
  await expect.poll(()=>viewport.evaluate((element,index)=>Math.abs(element.scrollLeft/element.clientWidth-index),target)).toBeLessThan(.01);
}
test('minimal card, defaults, picker and person suggestions',async({page})=>{
  await mount(page);
  await expect(page.locator('[data-page]')).toHaveCount(2);
  await expect(page.locator('[data-status]')).toHaveCount(1);
  expect(await page.evaluate(()=>window.customCards[0].getEntitySuggestion(hass,'person.example').config.person)).toBe('person.example');
  expect(await page.evaluate(()=>window.customCards[0].getEntitySuggestion(hass,'light.example'))).toBeNull();
  expect(await page.evaluate(()=>customElements.get('person-central-card').getStubConfig(hass).person)).toBe('person.example');
  await go(page,'Informações');await expect(page.locator('person-central-details h2')).toHaveText('Alex');
});
test('status values, thresholds, zones and missing entities',async({page})=>{
  await mount(page,full);await expect(page.locator('[data-status]')).toHaveCount(4);
  await expect(page.locator('[data-status="battery"]')).toHaveText('85%');
  for(const [value,color] of [['50','rgb(255, 165, 0)'],['30','rgb(228, 86, 73)'],['51','rgb(80, 161, 79)']]){
    await page.evaluate(value=>{hass.states['sensor.battery']={state:value};card.hass={...hass};},value);
    await expect(page.locator('[data-status="battery"]')).toHaveCSS('color',color);
  }
  await go(page,'Informações');await expect(page.locator('[data-detail="battery"]')).toContainText('Carregando');
  await page.evaluate(()=>{hass.states['person.example']={state:'Trabalho',attributes:{friendly_name:'Alex'}};card.hass={...hass};});
  await expect(page.locator('[data-detail="location"]')).toContainText('Trabalho');
  await page.evaluate(()=>{delete hass.states['sensor.battery'];delete hass.states['person.example'];card.hass={...hass};});
  await expect(page.locator('[data-detail="battery"]')).toContainText('Indisponível');
  await expect(page.locator('person-central-details')).not.toContainText('undefined');
});
test('normal and critical notify payload, empty input and success reset',async({page})=>{
  await mount(page,full);await go(page,'Notificação');
  const form=page.locator('person-central-notification');
  await form.locator('button').click();await expect(form.locator('.feedback')).toHaveText('Digite uma mensagem.');
  await form.locator('textarea').fill('  Olá de casa  ');await form.locator('button').click();
  await expect(form.locator('.feedback')).toHaveText('Notificação enviada.');
  expect(await page.evaluate(()=>calls)).toEqual([['notify','mobile_app_example',{title:'Central',message:'Olá de casa'}]]);
  await form.locator('textarea').fill('Urgente');await form.locator('input').check();await form.locator('button').click();
  expect(await page.evaluate(()=>calls[1][2].data)).toEqual({push:{sound:{name:'default',critical:1,volume:1}}});
  await expect(form.locator('textarea')).toHaveValue('');await expect(form.locator('input')).not.toBeChecked();
});
test('pending send prevents duplicates; error keeps message and permits retry',async({page})=>{
  await mount(page,full);await go(page,'Notificação');
  await page.evaluate(()=>{hass.callService=(...args)=>{calls.push(args);return new Promise((_resolve,reject)=>window.rejectSend=reject);};});
  const form=page.locator('person-central-notification');
  await form.locator('textarea').fill('Mensagem');await form.locator('button').click();
  await expect(form.locator('button')).toBeDisabled();
  await form.locator('form').dispatchEvent('submit');expect(await page.evaluate(()=>calls.length)).toBe(1);
  await page.evaluate(()=>window.rejectSend(new Error('network')));
  await expect(form.locator('.feedback')).toContainText('Erro');await expect(form.locator('textarea')).toHaveValue('Mensagem');
  await page.evaluate(()=>{hass.callService=async(...args)=>{calls.push(args);};});
  await form.locator('button').click();await expect(form.locator('.feedback')).toHaveText('Notificação enviada.');
});
test('draft, caret and Critical survive hass updates, navigation and reorder',async({page})=>{
  await mount(page,full);await go(page,'Notificação');
  const input=page.locator('person-central-notification textarea');await input.fill('Rascunho');await input.press('ArrowLeft');
  await page.locator('person-central-notification input').check();
  await page.evaluate(()=>{hass.states['sensor.battery']={state:'40'};card.hass={...hass};});
  await expect(input).toHaveValue('Rascunho');await expect(page.locator('person-central-notification input')).toBeChecked();
  await go(page,'Perfil');await go(page,'Notificação');await expect(input).toHaveValue('Rascunho');
  await page.evaluate(()=>card.setConfig({...card.config,page_order:['notification','profile','details']}));
  await expect(input).toHaveValue('Rascunho');
  await page.evaluate(()=>card.setConfig({...card.config,person:'person.other'}));await expect(input).toHaveValue('');
});
test('one page disables swipe; order, loop, hidden indicators and disabled swipe',async({page})=>{
  await mount(page,{pages:{details:{enabled:false}}});await expect(page.locator('person-central-swipe nav')).toHaveCount(0);
  await page.evaluate(()=>card.setConfig({person:'person.example',page_order:['details','profile'],swipe:{loop:true,enabled:false,show_indicators:false}}));
  await expect(page.locator('.slide').first()).toHaveAttribute('data-page','details');
  await expect(page.locator('person-central-swipe .dot')).toHaveCount(0);
  await expect(page.locator('[data-page="profile"]')).toHaveAttribute('aria-hidden','false');
  await page.locator('person-central-swipe button[aria-label="Próxima página"]').click();
  await expect(page.locator('[data-page="details"]')).toHaveAttribute('aria-hidden','false');
  await page.locator('person-central-swipe button[aria-label="Página anterior"]').click();
  await expect(page.locator('[data-page="profile"]')).toHaveAttribute('aria-hidden','false');
});
test('keyboard and mouse drag navigate while input gestures stay local',async({page},info)=>{
  await mount(page,full);
  const viewport=page.locator('person-central-swipe .viewport');
  await viewport.focus();await viewport.press('ArrowRight');await expect(page.locator('[data-page="details"]')).toHaveAttribute('aria-hidden','false');
  if(info.project.name==='chromium'){
    await page.waitForTimeout(400);const box=await viewport.boundingBox();
    await page.mouse.move(box.x+box.width*.85,box.y+box.height*.8);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.8,{steps:12});await page.mouse.up();
    await expect(page.locator('[data-page="notification"]')).toHaveAttribute('aria-hidden','false');
  }else await go(page,'Notificação');
  await page.evaluate(()=>{window.escaped=0;document.addEventListener('keydown',()=>window.escaped++);});
  const input=page.locator('person-central-notification textarea');await input.fill('abcdef');await input.press('ArrowLeft');
  await expect(page.locator('[data-page="notification"]')).toHaveAttribute('aria-hidden','false');expect(await page.evaluate(()=>escaped)).toBe(0);
});
test('image modes, broken image fallback, theme and safe text',async({page})=>{
  await mount(page);
  await page.evaluate(()=>{hass.states['person.example']={state:'home',attributes:{friendly_name:'<img src=x onerror=alert(1)>',entity_picture:'javascript:alert(1)'}};card.hass={...hass};});
  await expect(page.locator('person-central-profile img')).toHaveCount(0);
  await page.evaluate(()=>card.setConfig({...card.config,profile:{image:{mode:'background'}}}));await expect(page.locator('.portrait')).toHaveClass(/background/);
  await page.evaluate(()=>{hass.states['person.example']={state:'home',attributes:{friendly_name:'Alex',entity_picture:'/missing.jpg'}};card.hass={...hass};});
  await expect(page.locator('person-central-profile .fallback')).toBeVisible();
  await page.evaluate(()=>card.setConfig({...card.config,profile:{image:{mode:'none'}}}));await expect(page.locator('.portrait')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('strict configuration rejects invalid inputs and allows legacy page toggles',async({page})=>{
  await mount(page);
  const results=await page.evaluate(()=>{
    const configs=[{person:'sensor.battery'},{person:'person.example',notification:{enabled:true}},{person:'person.example',page_order:['profile','profile']},{person:'person.example',page_order:['notification']},{person:'person.example',notification:{critical:{volume:2}}},{person:'person.example',profile:{image:{size:200}}}];
    return configs.map(config=>{try{card.setConfig(config);return false;}catch{return true;}});
  });expect(results.every(Boolean)).toBe(true);
  await page.evaluate(()=>card.setConfig({person:'person.example',details:{enabled:false}}));await expect(page.locator('[data-page]')).toHaveCount(1);
});
test('editor emits config-changed, filters person, preserves advanced config and reorders',async({page})=>{
  await mount(page);
  await page.evaluate(async()=>{
    window.editor=await customElements.get('person-central-card').getConfigElement();editor.hass=hass;
    editor.setConfig({person:'person.example',colors:{home:'#123456'}});
    editor.addEventListener('config-changed',event=>window.edited=event.detail.config);document.body.append(editor);
  });
  const editor=page.locator('person-central-card-editor');
  await expect(editor.locator('[data-path="person"]')).toHaveValue('person.example');
  await expect(editor.locator('[data-path="person"] option[value="sensor.battery"]')).toHaveCount(0);
  await editor.locator('[data-path="person"]').selectOption('person.other');expect(await page.evaluate(()=>edited.person)).toBe('person.other');
  expect(await page.evaluate(()=>edited.colors.home)).toBe('#123456');
  await editor.getByRole('button',{name:'Subir Informações'}).click();expect(await page.evaluate(()=>edited.page_order)).toEqual(['details','profile']);
  await editor.locator('[data-path="pages.notification.enabled"]').first().check();await expect(editor.locator('.error')).toContainText(['Selecione']);
  await editor.locator('[data-path="notification.notify_service"]').fill('notify.mobile_app_example');
  expect(await page.evaluate(()=>edited.notification.notify_service)).toBe('notify.mobile_app_example');
});
test('editor uses the HA entity selector contract when available',async({page})=>{
  await mount(page);
  await page.evaluate(async()=>{
    customElements.define('ha-selector',class extends HTMLElement{});
    const editor=await customElements.get('person-central-card').getConfigElement();editor.hass=hass;editor.setConfig({person:'person.example'});
    editor.addEventListener('config-changed',e=>window.edited=e.detail.config);document.body.append(editor);
  });
  const selector=page.locator('person-central-card-editor ha-selector[data-path="person"]');
  expect(await selector.evaluate(el=>el.selector)).toEqual({entity:{filter:{domain:'person'}}});
  await selector.evaluate(el=>el.dispatchEvent(new CustomEvent('value-changed',{detail:{value:'person.other'}})));
  expect(await page.evaluate(()=>edited.person)).toBe('person.other');
});

test('touch swipe over portrait changes page but never opens more-info; textarea gesture does not swipe',async({page},info)=>{
  test.skip(info.project.name!=='mobile','Real touch input uses the mobile context');
  await mount(page,full);
  await page.evaluate(()=>{window.moreInfo=0;document.addEventListener('hass-more-info',()=>window.moreInfo++);});
  const client=await page.context().newCDPSession(page);
  const swipe=async(locator)=>{
    const box=await locator.boundingBox(),y=box.y+box.height*.5;
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y}]});
    for(let step=1;step<=8;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.8-.6*step/8),y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  await swipe(page.locator('.portrait'));
  await expect(page.locator('[data-page="details"]')).toHaveAttribute('aria-hidden','false');
  expect(await page.evaluate(()=>window.moreInfo)).toBe(0);
  await page.waitForTimeout(450);await go(page,'Notificação');
  await page.locator('textarea').fill('Mensagem preservada');
  await swipe(page.locator('textarea'));
  await expect(page.locator('[data-page="notification"]')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('textarea')).toHaveValue('Mensagem preservada');
});

test('critical toggle configuration, unavailable notify and stale in-flight completion',async({page})=>{
  await mount(page,{...full,notification:{notify_service:'notify.mobile_app_example',critical:{enabled:false,default:true,volume:.4}}});
  await go(page,'Notificação');await expect(page.locator('person-central-notification input')).toHaveCount(0);
  await page.locator('textarea').fill('Normal');await page.locator('person-central-notification button').click();
  expect(await page.evaluate(()=>calls[0][2].data)).toBeUndefined();
  await page.evaluate(()=>{hass.services={notify:{}};card.hass={...hass};});
  await page.locator('textarea').fill('Sem serviço');await page.locator('person-central-notification button').click();
  await expect(page.locator('.feedback')).toContainText('indisponível');expect(await page.evaluate(()=>calls.length)).toBe(1);
  await page.evaluate(()=>{hass.services={notify:{mobile_app_example:{}}};hass.callService=()=>new Promise(resolve=>window.resolveSend=resolve);card.hass={...hass};});
  await page.locator('person-central-notification button').click();
  await page.evaluate(()=>card.setConfig({...card.config,person:'person.other'}));
  await page.locator('textarea').fill('Novo destinatário');await page.evaluate(()=>window.resolveSend());
  await expect(page.locator('textarea')).toHaveValue('Novo destinatário');
});

test('preview light and dark, compact layout and all editor sections',async({page},info)=>{
  await mount(page,full);
  await page.evaluate(()=>{hass.states['person.example']={state:'home',attributes:{friendly_name:'Alex',entity_picture:'/docs/demo-person.svg'}};card.hass={...hass};});
  await page.locator('person-central-profile img').evaluate(img=>img.decode());
  if(info.project.name==='chromium'){
    await page.locator('person-central-card').screenshot({path:'docs/profile.png'});
    await go(page,'Informações');
    await expect.poll(()=>page.locator('person-central-details .page').evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
    await page.locator('person-central-card').screenshot({path:'docs/details.png'});
    await go(page,'Notificação');await page.locator('person-central-card').screenshot({path:'docs/notification.png'});
    await page.addStyleTag({content:':root{--primary-text-color:#e2e8f0;--secondary-text-color:#94a3b8;--card-background-color:#182538;--secondary-background-color:#26364c;--divider-color:#34465e}body{background:#0f172a}'});
    await page.locator('person-central-card').screenshot({path:'docs/dark.png'});
  }
  await page.setViewportSize({width:320,height:700});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(async()=>{const editor=await customElements.get('person-central-card').getConfigElement();editor.hass=hass;editor.setConfig(card.config);document.body.append(editor);});
  await expect(page.locator('person-central-card-editor summary')).toHaveCount(8);
});
