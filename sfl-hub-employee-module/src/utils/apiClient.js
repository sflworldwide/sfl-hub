import axios from "axios";
import { apiBase } from "../utils/config";
import { CommonConfig } from "../utils/constant";
const instance = axios.create({
  baseURL: apiBase,
  timeout: 60000,
  responseType: "json",
  withCredentials: true,
});


var headers = {
 //'Accept': 'application/json',
  "Content-Type": "application/json",
  // "Access-Control-Allow-Origin": "*",
  // "Access-Control-Allow-Headers": "*",
};
const getAuthToken = () => localStorage.getItem("token") || null;
const request = (method, url, data) => {
  return new Promise((resolve, reject) => {
    (() => {
      window.addEventListener("beforeunload", function() {
        CommonConfig.releaseLockShipment();
      });
      const token = getAuthToken();
      if (method === "get") {
       // data.token=localStorage.getItem("token");
      //  console.log("data get",data);
        //data.token=localStorage.getItem("token");
        if(data!= undefined)
        data.token = token;
      else
      data={token:token};
        return instance.request({
          url,
          method,
          params: data,
          headers: headers,
      //    token: localStorage.getItem("token"),
        });
      } else {
        //data.token=localStorage.getItem("token");
       // console.log("data post",data);
      
       if(data instanceof FormData)
        data.token = token;
        else
        data = { ...data, token };
        return instance.request({
          url,
          method,
          data,
          headers: headers,
        //  token: localStorage.getItem("token"),
        });
      }
    })()
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err.response);
      });
  });
};

export default {
  get: (endpoint, data) => {
    return request("get", endpoint, data);
  },
  post: (endpoint, data) => {
    return request("post", endpoint, data);
  },
  put: (endpoint, data) => {
    return request("put", endpoint, data);
  },
  del: (endpoint, data) => {
    return request("delete", endpoint, data);
  },
};
