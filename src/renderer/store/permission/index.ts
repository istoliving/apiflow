import { router, routes as allRoutes } from '@/router';
import { config } from '@src/config/config';
import { GlobalConfig, PermissionClientMenu, PermissionClientRoute, PermissionUserInfo, Response } from '@src/types/global';
import { defineStore } from 'pinia'
import layout from '@/pages/layout/layout.vue';
import { RouteRecordRaw } from 'vue-router';
import { ref } from 'vue';
import { uniqueByKey } from '@/helper';
import { axios } from '@/api/api';
import { globalCache } from '@/cache/cache';

type ResUserInfo = PermissionUserInfo & {
  clientBanner: PermissionClientMenu[],
  clientRoutes: PermissionClientRoute[],
  globalConfig: GlobalConfig
}

export const usePermissionStore = defineStore('permission', () => {

  const globalConfig = ref<GlobalConfig>({
    title: "",
    version: "",
    consoleWelcome: false,
    enableRegister: false,
    enableGuest: false,
    enableDocLink: false,
    shareUrl: '',
    autoUpdate: false,
    updateUrl: '',
  })
  const userInfo = ref<PermissionUserInfo>({
    id: "",
    loginName: '',
    phone: '',
    realName: '',
    roleIds: [],
  });
  const routes = ref<PermissionClientRoute[]>([]);
  const menus = ref<{ path: string; name: string }[]>([]);
  const loadingBanner = ref(false);

  //改变全局配置
  const changeGlobalConfig = (payload: GlobalConfig) => {
    globalConfig.value = payload;
    globalCache.changeGlobalConfig(payload);
  }
  //改变用户信息
  const changeUserInfo = (payload: PermissionUserInfo): void => {
    userInfo.value = {
      id: payload.id,
      loginName: payload.loginName,
      phone: payload.phone,
      realName: payload.realName,
      roleIds: payload.roleIds,
    };
  }
  //动态生成路由
  const generateRoutes = () => {
    if (config.renderConfig.permission.free) { //free模式允许看见所有路由信息
      router.addRoute({
        path: '/v1',
        component: layout,
        children: [
          ...allRoutes,
        ],
      });
    } else {
      const matchedRoutes: RouteRecordRaw[] = [];
      allRoutes.forEach((route: RouteRecordRaw) => { //遍历本地所有路由
        routes.value.forEach((val) => {
          if (val.path === route.path) {
            if (!matchedRoutes.find((m) => m.path === val.path)) { //如果已经存在匹配的数据则不再push
              matchedRoutes.push(route);
            }
          }
        });
      });
    }
  }
  //改变用户可访问路由
  const changeRoutes = (payload: PermissionClientRoute[]): void => {
    const localRoutesStr = sessionStorage.getItem('permission/routes') || '[]';
    const localRoutes = JSON.parse(localRoutesStr) as PermissionClientRoute[];
    const storeRoutes = uniqueByKey(localRoutes.concat(payload), 'path');
    sessionStorage.setItem('permission/routes', JSON.stringify(storeRoutes));
    routes.value = storeRoutes;
  }
  //改变当前访问菜单
  const changeMenus = (payload: PermissionClientMenu[]) => {
    if (config.renderConfig.permission.free && userInfo.value.loginName === 'admin') {
      menus.value = [{
        path: '/v1/apidoc/doc-list',
        name: 'api文档',
      }, {
        path: '/v1/permission/permission',
        name: '权限管理',
      }];
    } else if (config.renderConfig.permission.free) {
      menus.value = [{
        path: '/v1/apidoc/doc-list',
        name: 'api文档',
      }];
    } else {
      menus.value = payload;
    }
  }
  //清空全部权限
  const clearAllPermission = () => {
    routes.value = [];
    menus.value = [];
  };
  //获取权限
  const getPermission = async (): Promise<ResUserInfo> => {
    return new Promise((resolve, reject) => {
      axios.get<Response<ResUserInfo>, Response<ResUserInfo>>('/api/security/user_base_info').then((res) => {
        changeUserInfo(res.data);
        changeMenus(res.data.clientBanner);
        changeRoutes(res.data.clientRoutes);
        changeGlobalConfig(res.data.globalConfig);
        generateRoutes();
        resolve(res.data);
        sessionStorage.setItem('permission/userInfo', JSON.stringify(res.data));
      }).catch((err) => {
        reject(err);
      });
    });
  }

  return {
    userInfo,
    routes,
    menus,
    loadingBanner,
    globalConfig,
    changeGlobalConfig,
    changeUserInfo,
    generateRoutes,
    changeRoutes,
    changeMenus,
    clearAllPermission,
    getPermission,
  }
})