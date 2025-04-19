---
title: 'Ingress nginx 413 에러 해결하기'
date: '2022-12-19T16:46:38.375Z'
tags: ['kubernetes']
---

### 개요

현재 진행 중인 사이드 프로젝트의 개발 환경을 위해 온프레미스상에 쿠버네티스 클러스터를 구축하고 관리하고 있다.

개발을 진행하면서 클라이언트와 백엔드 서버가 통신하는 과정에 문제가 발생하였다.

이미지 업로드 요구사항으로 최대 10개까지 가능해야 했지만, 3개 이상 보낼 경우 클라이언트에 다음과 같은 에러가 발생하였다.

(현재 클라이언트로 안드로이드 애플리케이션을 개발하고 있다.)

![android 413](https://user-images.githubusercontent.com/59433441/208373346-68852df2-3434-48c0-b7de-ad9087801ab3.png)

요청 파일 크기가 업로드 가능한 용량을 초과하는 문제인 것 같아서 `ingress nginx controller` 로그를 확인해 보니 다음과 같이 `413(Request Entity Too Large)` 에러가 발생하고 있었다.

```bash
2022/12/18 16:15:26 [error] 1396#1396: *94696338 client intended to send too large body: 2905329 bytes, client: 10.244.219.64, server: api.comeeatme.zooneon.dev, request: "POST /v1/images/scaled HTTP/2.0", host: "api.comeeatme.zooneon.dev"
10.244.219.64 - - [18/Dec/2022:16:15:26 +0000] "POST /v1/images/scaled HTTP/2.0" 413 176 "-" "okhttp/4.10.0" 76 0.000 [-] [] - - - - 99054c4f5c1643dc555b8964df874e62
```

클라이언트에서 파일 크기를 줄여 전송하는 방법도 있지만 이미 최대로 압축한 상태라 화질 저하 등 사용자 경험에 영향을 줄 수 있기 때문에 백엔드에서 업로드 크기 제한을 늘리기로 하였다.

### 업로드 크기 제한 늘리기

`ingress nginx controller`의 파일 업로드 크기 제한을 늘리는 방법은 두 가지가 있다.

먼저 `ConfigMap`을 이용하여 글로벌 설정을 바꾸는 방법이다.

(`nginx ingress controller`를 사용하는 경우 해당 설정과 다르다. [링크](https://docs.nginx.com/nginx-ingress-controller/configuration/global-configuration/configmap-resource/) 참고)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
data:
  proxy-body-size: '100m'
```

두 번째로 `Ingress`에 어노테이션을 적용하는 방법이 있다.

```yaml
nginx.ingress.kubernetes.io/proxy-body-size: 8m
```

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 100m
    ...
```

### 결론

현재 백엔드 애플리케이션 뿐만 아니라 다른 서비스들도 `Ingress nginx`로 노출시키고 있는데, 해당 기능을 위해 글로벌 설정을 변경하는 것은 불필요하다고 판단하였다.

(행여나 다른 서비스에서 크기가 큰 비정상 데이터 요청이 발생할 경우 적절하게 에러를 던지지 못하고 이로 인해 병목 현상이 발생할 수 있다고 생각하였다.)

따라서 어노테이션을 이용하여 해당 `Ingress` 규칙을 수정하는 방안을 선택하였다.

최대 허용 크기는 WAS에 설정한 크기와 동일하게 100MB로 설정하였다.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  labels:
    app.kubernetes.io/name: comeeatme
    app.kubernetes.io/instance: comeeatme-server-ing
  name: comeeatme-server-ing
  namespace: comeeatme
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: 100m
    ...
```

다시 요청을 시도해 보면 정상적으로 처리하고 있음을 확인할 수 있다.

```bash
2022/12/18 17:44:42 [warn] 1536#1536: *94783283 a client request body is buffered to a temporary file /tmp/nginx/client-body/0000000208, client: 10.244.219.64, server: api.comeeatme.zooneon.dev, request: "POST /v1/images/scaled HTTP/2.0", host: "api.comeeatme.zooneon.dev"
10.244.219.64 - - [18/Dec/2022:17:44:45 +0000] "POST /v1/images/scaled HTTP/2.0" 200 63 "-" "okhttp/4.10.0" 2949754 3.266 [comeeatme-comeeatme-server-svc-80] [] 10.244.235.134:8080 74 2.280 200 9e72b889113b29c30dfa77d14e42d870
10.244.219.64 - - [18/Dec/2022:17:44:46 +0000] "POST /v1/post HTTP/2.0" 200 33 "-" "okhttp/4.10.0" 131 0.183 [comeeatme-comeeatme-server-svc-80] [] 10.244.235.134:8080 44 0.182 200 e1c5bc5177f0e329162f71ad7f4a68d2
```

---

참고

- [https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#custom-max-body-size](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#custom-max-body-size)
- [https://github.com/kubernetes/ingress-nginx/blob/main/docs/examples/customization/custom-configuration/configmap.yaml](https://github.com/kubernetes/ingress-nginx/blob/main/docs/examples/customization/custom-configuration/configmap.yaml)
