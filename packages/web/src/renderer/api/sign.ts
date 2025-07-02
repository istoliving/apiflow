// 签名相关工具函数
import stringify from 'json-stable-stringify';

/*
|--------------------------------------------------------------------------
| url参数解析
|--------------------------------------------------------------------------
*/
export const parseUrl = (url: string) => {
  const [urlPart, queryPart] = url.split('?', 2);
  const queryParams: Record<string, string> = {};
  if (queryPart) {
    const pairs = queryPart.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=', 2);
      const decodedKey = decodeURIComponent(key || '');
      const decodedValue = decodeURIComponent((value === undefined ? '' : value).replace(/\+/g, ' '));
      queryParams[decodedKey] = decodedValue;
    }
  }
  return {
    url: urlPart,
    queryParams: queryParams
  };
}

/*
|--------------------------------------------------------------------------
| 获取加签后的请求参数
|--------------------------------------------------------------------------
*/
export const getStrParams = (params: Record<string, string> = {}) => {
  let strParams = '';
  const sortedKeys = Object.keys(params).filter(key => params[key] != null).sort();
  sortedKeys.forEach((key, index) => {
    if (index === sortedKeys.length - 1) {
      strParams += `${key}=${params[key]}`;
      return;
    }
    strParams += `${key}=${params[key]}&`;
  })
  return strParams;
}

/*
|--------------------------------------------------------------------------
| 获取加签后header
|--------------------------------------------------------------------------
*/
export const getStrHeader = (headers: Record<string, string> = {}) => {
  let strHeader = '';
  const sortedHeaderKeys = Object.keys(headers).filter(key => headers[key] != null).sort();
  sortedHeaderKeys.forEach((key, index) => {
    if (index === sortedHeaderKeys.length - 1) {
      strHeader += `${key.toLowerCase()}:${headers[key]}`;
      return;
    }
    strHeader += `${key.toLowerCase()}:${headers[key]}\n`;
  })
  return {
    strHeader,
    sortedHeaderKeys
  };
}

/*
|--------------------------------------------------------------------------
| 获取加签后的请求body
|--------------------------------------------------------------------------
*/
export const getStrJsonBody = async (data: Record<string, string> = {}) => {
  if (Object.prototype.toString.call(data) === '[object Object]') {
    const sortedJson = stringify(data);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(sortedJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    return getHashedContent(hashBuffer);
  }
}

export const getHashedContent = (hashBuffer: ArrayBuffer) => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
