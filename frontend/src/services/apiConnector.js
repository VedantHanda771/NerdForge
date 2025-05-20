import axios from "axios"

const BASE_URL = "http://localhost:5000/api/v1";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

export const apiConnector = (method, url, bodyData, headers, params) => {
    return axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData ? bodyData : null,
        headers: headers ? headers : null,
        params: params ? params : null,
    });
}