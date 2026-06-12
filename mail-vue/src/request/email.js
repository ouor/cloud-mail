import http from '@/axios/index.js';
import axios from 'axios';
import {useSettingStore} from "@/store/setting.js";

export function emailList(accountId, allReceive, emailId, timeSort, size, type) {
    return http.get('/email/list', {params: {accountId, allReceive, emailId, timeSort, size, type}})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds)
}

export function emailLatest(emailId, accountId, allReceive) {
    return http.get('/email/latest', {params: {emailId, accountId, allReceive}, noMsg: true, timeout: 35 * 1000})
}

export function emailRead(emailIds) {
    return http.put('/email/read', {emailIds})
}

// 导出全部邮件为 .mbox, 走原生 axios 以绕过统一的 JSON 响应拦截器
export function emailExport() {
    return axios.get(import.meta.env.VITE_BASE_URL + '/email/export', {
        responseType: 'blob',
        headers: {
            Authorization: localStorage.getItem('token'),
            'accept-language': useSettingStore().lang
        },
        timeout: 0
    })
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}