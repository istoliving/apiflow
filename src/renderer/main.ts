import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { axiosPlugin } from './api/api';
import ElementPlus from 'element-plus';
import { router } from './router'
import '@/assets/css/index.css'
import i18next from 'i18next';
import I18NextVue from "i18next-vue";
import Backend from 'i18next-http-backend'
import { customDirective } from './directive/directive';


const pinia = createPinia();
const app = createApp(App);


await i18next.use(Backend).init({
  lng: 'zh',
  fallbackLng: "zh",
});
app.use(pinia)
app.use(axiosPlugin).use(customDirective).use(I18NextVue, { i18next }).use(ElementPlus, { locale: zhCn }).use(router);
app.mount('#app')
