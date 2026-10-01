import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', timeout:20000,
  use:{baseURL:'http://127.0.0.1:8769',headless:true},
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'mobile',use:{browserName:'chromium',viewport:{width:390,height:844},hasTouch:true,isMobile:true}}],
  webServer:{command:'node tests/server.mjs',url:'http://127.0.0.1:8769',reuseExistingServer:false},
});
