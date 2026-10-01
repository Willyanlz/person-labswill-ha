const messages = {
  pt: { profile: 'Perfil', details: 'Informações', person: 'Pessoa', home: 'Em casa', away: 'Fora de casa', unknown: 'Indisponível', location: 'Localização', battery: 'Bateria', battery_state: 'Estado da bateria', ringer: 'Modo do celular', charging: 'Carregando', not_charging: 'Não carregando', full: 'Carregada', normal: 'Normal', silent: 'Silencioso', vibrate: 'Vibração', launch: 'Inicialização do app', manual: 'Atualização manual', periodic: 'Atualização periódica', significant_location_change: 'Mudança significativa de localização', geographic_region_entered: 'Entrada em zona geográfica', geographic_region_exited: 'Saída de zona geográfica', push_notification: 'Notificação push', background_fetch: 'Atualização em segundo plano', siri: 'Siri', ibeacon_region_entered: 'Entrada em região iBeacon', registration: 'Registro do dispositivo', signaled: 'Alteração detectada', on: 'Ligado', off: 'Desligado', unavailable: 'Pessoa indisponível' },
  en: { profile: 'Profile', details: 'Details', person: 'Person', home: 'At home', away: 'Away', unknown: 'Unavailable', location: 'Location', battery: 'Battery', battery_state: 'Battery state', ringer: 'Ringer mode', charging: 'Charging', not_charging: 'Not charging', full: 'Full', normal: 'Normal', silent: 'Silent', vibrate: 'Vibrate', launch: 'App launch', manual: 'Manual update', periodic: 'Periodic update', significant_location_change: 'Significant location change', geographic_region_entered: 'Geographic region entered', geographic_region_exited: 'Geographic region exited', push_notification: 'Push notification', background_fetch: 'Background fetch', siri: 'Siri', ibeacon_region_entered: 'iBeacon region entered', registration: 'Device registration', signaled: 'Change detected', on: 'On', off: 'Off', unavailable: 'Person unavailable' },
};
const stateKey = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
export function translator(config, hass) {
  const lang = config.language === 'auto' ? (hass?.locale?.language || hass?.language || 'pt') : config.language;
  const dictionary = messages[lang.startsWith('pt') ? 'pt' : 'en'];
  return key => dictionary[key] || key;
}
function translatedState(value, t) {
  const key = stateKey(value);
  const translated = t(key);
  return translated === key ? value : translated;
}
export function safeImage(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
export function cssValue(property, value, fallback) {
  return typeof value === 'string' && CSS.supports(property, value) ? value : fallback;
}
export function stateValue(hass, id) {
  const value = id && hass?.states?.[id]?.state;
  return value == null || ['', 'unknown', 'unavailable', 'none'].includes(String(value).toLowerCase()) ? null : String(value);
}
export function personModel(config, hass) {
  const t = translator(config, hass);
  const person = hass?.states?.[config.person];
  const state = stateValue(hass, config.person);
  const colors = Object.fromEntries(Object.entries(config.colors).map(([k,v]) => [k, cssValue('color', v, 'var(--secondary-text-color)')]));
  const batteryRaw = stateValue(hass, config.sensors.battery);
  const number = batteryRaw == null ? NaN : Number(batteryRaw);
  const battery = Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
  const chargingRaw = stateValue(hass, config.sensors.battery_state);
  const charging = chargingRaw?.toLowerCase().replaceAll(' ', '_');
  const ringRaw = stateValue(hass, config.sensors.ringer);
  const ring = ringRaw?.toLowerCase();
  const bt = stateValue(hass, config.sensors.bluetooth)?.toLowerCase();
  const rows = {
    location: { icon: state === 'home' ? 'mdi:home' : state === 'not_home' ? 'mdi:home-export-outline' : 'mdi:map-marker',
      value: !state ? t('unknown') : state === 'home' ? t('home') : state === 'not_home' ? t('away') : state,
      color: !state ? colors.unknown : state === 'home' ? colors.home : state === 'not_home' ? colors.away : colors.zone },
    battery: config.sensors.battery ? { icon: 'mdi:battery', value: battery == null ? t('unknown') : `${battery}%`,
      color: battery == null ? colors.unknown : battery <= 30 ? colors.battery_low : battery <= 50 ? colors.battery_medium : colors.battery_high } : null,
    battery_state: config.sensors.battery_state ? { icon: 'mdi:battery-charging', value: !charging ? t('unknown') : ['charging', 'not_charging', 'full'].includes(charging) ? t(charging) : chargingRaw, color: colors.unknown } : null,
    ringer: config.sensors.ringer ? { icon: ring === 'silent' ? 'mdi:cellphone-off' : ring === 'vibrate' ? 'mdi:vibrate' : 'mdi:cellphone',
      value: !ring ? t('unknown') : translatedState(ringRaw, t),
      color: !ring ? colors.unknown : ring === 'silent' ? colors.ringer_silent : ring === 'vibrate' ? colors.ringer_vibrate : colors.ringer_normal } : null,
    bluetooth: config.sensors.bluetooth ? { icon: bt === 'on' ? 'mdi:bluetooth' : 'mdi:bluetooth-off',
      value: ['on', 'off'].includes(bt) ? t(bt) : t('unknown'), color: bt === 'on' ? colors.bluetooth_on : bt === 'off' ? colors.bluetooth_off : colors.unknown } : null,
  };
  return { name: person?.attributes?.friendly_name || t('person'), image: safeImage(person?.attributes?.entity_picture), unavailable: !state, rows, t };
}
