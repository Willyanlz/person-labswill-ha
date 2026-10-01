export const PAGE_IDS = ['profile', 'details', 'notification'];
export const DEFAULTS = {
  type: 'custom:person-central-card', person: '', language: 'pt',
  pages: { profile: { enabled: true }, details: { enabled: true }, notification: { enabled: false } },
  profile: { image: { mode: 'circle', size: 65, object_fit: 'cover', background_position: 'center' },
    status: { enabled: true, show_location: true, show_ringer: false, show_battery: false, show_bluetooth: false,
      position: 'top', background: 'auto', border_radius: 18, opacity: 0.85 } },
  details: { show_image: true, show_name: true, show_location: true, show_battery: true,
    show_battery_state: true, show_ringer: true, show_bluetooth: true },
  sensors: {},
  notification: { notify_service: '', title: 'Central', critical: { enabled: true, default: false, volume: 1 } },
  appearance: { border_radius: 20, aspect_ratio: 1, padding: 0, background: 'auto' },
  swipe: { enabled: true, show_indicators: true, loop: false, effect: 'slide' },
  colors: { home: '#50A14F', away: '#e45649', zone: '#52adff', unknown: 'var(--secondary-text-color)',
    bluetooth_on: '#52adff', bluetooth_off: '#e45649', battery_high: '#50A14F', battery_medium: '#FFA500',
    battery_low: '#e45649', ringer_normal: '#50A14F', ringer_vibrate: '#FFA500', ringer_silent: '#e45649' },
};
export function merge(base, value) {
  const result = structuredClone(base);
  for (const [key, item] of Object.entries(value || {})) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    result[key] = item && typeof item === 'object' && !Array.isArray(item)
      ? merge(result[key] && typeof result[key] === 'object' ? result[key] : {}, item) : item;
  }
  return result;
}
export function enabledPages(config) {
  return PAGE_IDS.filter(id => config.pages[id].enabled);
}
export function normalize(raw, validate = true) {
  const config = merge(DEFAULTS, raw);
  for (const id of PAGE_IDS) {
    if (raw?.[id]?.enabled !== undefined && raw?.pages?.[id]?.enabled === undefined) config.pages[id].enabled = raw[id].enabled;
  }
  if (raw?.appearance?.profile_image_size !== undefined && raw?.profile?.image?.size === undefined) config.profile.image.size = raw.appearance.profile_image_size;
  if (raw?.appearance?.status_background !== undefined && raw?.profile?.status?.background === undefined) config.profile.status.background = raw.appearance.status_background;
  if (config.swipe.effect === 'coverflow') config.swipe.effect = 'slide';
  const enabled = enabledPages(config);
  config.page_order = raw?.page_order ? [...raw.page_order] : enabled;
  if (!validate) return config;
  if (!/^person\.[a-z0-9_]+$/.test(config.person)) throw new Error('Selecione uma entidade do domínio person.');
  if (!enabled.length) throw new Error('Habilite ao menos uma página.');
  if (!Array.isArray(raw?.page_order ?? []) || new Set(config.page_order).size !== config.page_order.length ||
    config.page_order.some(id => !enabled.includes(id)) || enabled.some(id => !config.page_order.includes(id))) {
    throw new Error('page_order deve conter cada página habilitada exatamente uma vez.');
  }
  if (config.pages.notification.enabled && !/^notify\.[a-z0-9_]+$/.test(config.notification.notify_service)) {
    throw new Error('Selecione notification.notify_service (notify.mobile_app_...).');
  }
  const range = (value, min, max, name) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${name}: use um número entre ${min} e ${max}.`);
  };
  range(config.notification.critical.volume, 0, 1, 'critical.volume');
  range(config.profile.image.size, 10, 100, 'profile.image.size');
  range(config.profile.status.opacity, 0, 1, 'profile.status.opacity');
  range(config.profile.status.border_radius, 0, 100, 'profile.status.border_radius');
  range(config.appearance.border_radius, 0, 100, 'appearance.border_radius');
  range(config.appearance.padding, 0, 100, 'appearance.padding');
  range(config.appearance.aspect_ratio, 0.4, 3, 'appearance.aspect_ratio');
  if (config.appearance.card_height != null) range(config.appearance.card_height, 180, 1600, 'appearance.card_height');
  for (const [value, allowed, name] of [
    [config.profile.image.mode, ['circle', 'background', 'none'], 'image.mode'],
    [config.profile.image.object_fit, ['cover', 'contain'], 'image.object_fit'],
    [config.profile.status.position, ['top', 'bottom'], 'status.position'],
    [config.swipe.effect, ['slide'], 'swipe.effect'],
    [config.language, ['pt', 'en', 'auto'], 'language'],
  ]) if (!allowed.includes(value)) throw new Error(`${name}: ${allowed.join(', ')}.`);
  for (const entity of Object.values(config.sensors)) {
    if (entity && !/^[a-z_]+\.[a-z0-9_]+$/.test(entity)) throw new Error('Sensor inválido: informe um entity_id.');
  }
  return config;
}
