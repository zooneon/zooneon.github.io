---
title: '쿠버네티스 서비스'
date: '2022-11-16T01:29:32.421Z'
---

## 서비스 개념

- 파드는 컨트롤러가 관리하므로 한군데에 고정해서 실행되지 않고 클러스터 안을 옮겨 다님
- 노드를 옮기면서 실행되기도 하고 클러스터 안 파드의 IP가 변경되기도 함
- 동적으로 변하는 파드들에 고정적으로 접근할 때 사용하는 방법이 쿠버네티스의 `서비스`
- 서비스를 사용하면 고정 주소를 이용해 파드에 접근 가능
- 클러스터 외부에서 클러스터 안 파드에 접근 가능
  - 클러스터 외부에서 인그레스 `Ingress` 로도 접근할 수 있지만 서비스는 주로 L4 영역에서 통신할 때 사용하고 인그레스는 L7 영역에서 통신할 때 사용
  - 두 가지를 혼합해서 사용할 수도 있지만 보통 역할을 분리해서 사용

## 서비스 타입

- ClusterIP
  - 기본 서비스 타입
  - 쿠버네티스 클러스터 안에서만 사용 가능
  - 클러스터 안 노드나 파드에서는 ClusterIP를 이용해서 서비스에 연결된 파드에 접근
  - 클러스터 외부에서는 이용 불가능
- NodePort
  - 서비스 하나에 모든 노드의 지정된 포트를 할당
    - 포트번호 지정 안할 시 `30000 ~ 32768` 랜덤포트 사용
  - 노드에 상관없이 서비스에 지정된 포트 번호만 사용하면 파드에 접근 가능
  - 노드의 포트를 사용하므로 클러스터 외부에서도 접근 가능
  - node1에서 파드가 실행 중이고 node2에서 실행 중이지 않을 때 node2로 접근해도 node1에 실행된 파드로 연결 가능
    - 단 `second hop` 문제 발생 가능 → latency 발생
  - 클러스터 외부에서 클러스터 안 파드로 접근할 때 사용할 수 있는 가장 간단한 방법
- LoadBalancer
  - AWS, GCP, OpenStack, 쿠버네티스를 지원하는 로드밸런서 장비에서 사용
  - 클라우드에서 제공하는 로드밸런서와 파드를 연결한 후 해당 로드밸런서의 IP를 이용해 클러스터 외부에서 파드에 접근할 수 있도록 해줌
  - 서비스 타입 `LoadBalancer` 를 사용할 경우 `kubectl get svc` 명령을 실행했을 때 `EXTERNAL-IP` 항목에 로드밸런서 IP 확인 가능
  - 해당 IP를 사용해 클러스터 외부에서 파드에 접근
- ExternalName
  - 서비스를 `.spec.externalName` 필드에 설정한 값과 연결
  - 클러스터 안에서 외부에 접근할 때 주로 사용
    - 언제 클러스터 안에서 외부로 접근할까?
  - `ExternalName` 서비스로 클러스터 외부에 접근하면 설정해둔 `CNAME` 값을 이용해 클러스터 외부에 접근 가능
  - 클러스터 외부에 접근할 때 사용하는 값이므로 설정할 때 `selector(.spec.selector)` 필드가 필요 없음
    - `selector` 필드는 서비스의 백엔드 파드를 지정할 때 사용

## 서비스 사용

### ClusterIP

```yaml
apiVersion: v1
kind: Service
metadata:
  name: clusterip-service #1
spec:
  type: ClusterIP #2
  clusterIP: 10.10.10.10 #3
  selector: # 4
    app: my-app
  ports: #5
    - protocol: TCP
      port: 80
      targetPort: 8080
```

`#1`

- 서비스의 이름 지정

`#2`

- 서비스 타입으로 ClusterIP 이용
- 타입 지정 안할 시 기본적으로 ClusterIP 이용

`#3`

- 클러스터 IP 직접 설정할 때 사용

`#4`

- 서비스에 연결할 백엔드 파드의 label 지정

`#5`

- 서비스에서 사용할 포트 정보
- 현재는 TCP 프로토콜을 사용하며 서비스 포트 80번으로 요청을 받아 파드의 8080번 포트로 전달한다.

```bash
$ kubectl get service
NAME                TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
clusterip-service   ClusterIP   10.10.10.10   <none>        80/TCP    17s
```

→ `CLUSTER-IP` 생성되고 외부 IP는 존재하지 않으므로 `EXTERNAL-IP`는 `<none>`

### NodePort

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service
spec:
  type: NodePort #1
  selector:
    app: my-app #2
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
      nodePort: 30001 #3
```

`#1`

- 서비스 타입으로 NodePort 이용

`#2`

- 서비스에 연결할 백엔드 파드의 label 지정

`#3`

- 노드의 30001번 포트 사용
- 모든 노드의 30001번 포트를 이용하여 접근 가능
- 포트번호 지정 안할 시 `30000 ~ 32768` 랜덤포트 사용

```bash
$ kubectl get service
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nodeport-service   NodePort    10.103.127.52   <none>        80:30001/TCP   19s
```

→ NodePort 타입이지만 `CLUSTER-IP`가 생성되고 노드의 30001번 포트가 `CLUSTER-IP`타입 서비스의 80번 포트와 연결됨

### LoadBalancer

```yaml
apiVersion: v1
kind: Service
metadata:
  name: lb-service
spec:
  type: LoadBalancer #1
  selector: #2
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

`#1`

- 서비스 타입으로 LoadBalancer 이용

`#2`

- 서비스에 연결할 백엔드 파드의 label 지정

```bash
$ kubectl get service
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
lb-service   LoadBalancer   10.107.254.85   192.168.0.181   80:31203/TCP   9s
```

→ `EXTERNAL-IP`가 생성되고 해당 IP를 통해 파드에 접근 가능

→ `EXTERNAL-IP`로 요청을 보내면 트래픽은 노드의 31203번 포트로 들어온 뒤 `CLUSTER-IP:PORT(10.107.254.85:80)`를 통해 파드의 targetPort로 들어감

### ExternalName

```yaml
apiVersion: v1
kind: Service
metadata:
  name: externalname-service
spec:
  type: ExternalName #1
  externalName: google.com #2
```

`#1`

- 서비스 타입으로 ExternalName 이용

`#2`

- 연결하려는 외부 도메인 값 설정

```bash
$ kubectl get service
NAME                   TYPE           CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
externalname-service   ExternalName   <none>       google.com    <none>    1s

$ kubectl exec -it netshoot -- curl externalname-service.default.svc.cluster.local
<!DOCTYPE html>
<html lang=en>
  <meta charset=utf-8>
  <meta name=viewport content="initial-scale=1, minimum-scale=1, width=device-width">
  <title>Error 404 (Not Found)!!1</title>
  <style>
    *{margin:0;padding:0}html,code{font:15px/22px arial,sans-serif}html{background:#fff;color:#222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}* > body{background:url(//www.google.com/images/errors/robot.png) 100% 5px no-repeat;padding-right:205px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777;text-decoration:none}a img{border:0}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}#logo{background:url(//www.google.com/images/branding/googlelogo/1x/googlelogo_color_150x54dp.png) no-repeat;margin-left:-5px}@media only screen and (min-resolution:192dpi){#logo{background:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) no-repeat 0% 0%/100% 100%;-moz-border-image:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) 0}}@media only screen and (-webkit-min-device-pixel-ratio:2){#logo{background:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) no-repeat;-webkit-background-size:100% 100%}}#logo{display:inline-block;height:54px;width:150px}
  </style>
  <a href=//www.google.com/><span id=logo aria-label=Google></span></a>
  <p><b>404.</b> <ins>That’s an error.</ins>
  <p>The requested URL <code>/</code> was not found on this server.  <ins>That’s all we know.</ins>

$ kubectl exec -it netshoot -- dig externalname-service.default.svc.cluster.local
..
;; ANSWER SECTION:
externalname-service.default.svc.cluster.local.	30 IN CNAME google.com.
google.com.		30	IN	A	172.217.161.238
```

→ `ExternalName`을 이용하여 google.com에 접속

→ google.com에 대한 CNAME 레코드 생성

## 헤드리스 서비스

- `.spec.clusterIP` 필드 값을 `None`으로 설정하면 클러스터 IP가 없는 `헤드리스 서비스`를 만들 수 있음
- 로드밸런싱이 필요 없거나 단일 서비스 IP가 필요 없을 때 사용
- `.spec.selector` 필드에 파드를 지정하면 쿠버네티스 API로 확인할 수 있는 엔드포인트가 생성됨
  - 서비스와 연결된 파드를 직접 가리키는 DNS A 레코드도 생성
  - selector가 없다면 엔드포인트는 만들어지지 않음
- `ExternalName` 서비스에서 사용할 CNAME 레코드 생성

```yaml
apiVersion: v1
kind: Service
metadata:
  name: headless-service
spec:
  type: ClusterIP
  clusterIP: None
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

```bash
$ kubectl get service
NAME               TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
headless-service   ClusterIP   None         <none>        80/TCP    2s
```

→ CLUSTER-IP와 EXTERNAL-IP 모두 none

```bash
$ kubectl describe service headless-service
Name:              headless-service
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=my-app
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                None
IPs:               None
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         10.244.189.76:80,10.244.235.175:80
Session Affinity:  None
Events:            <none>
```

→ 파드에 대한 엔드포인트 생성

```bash
$ kubectl exec -it netshoot -- bash
bash-5.2# dig headless-service.default.svc.cluster.local
..
;; ANSWER SECTION:
headless-service.default.svc.cluster.local. 30 IN A 10.244.189.76
headless-service.default.svc.cluster.local. 30 IN A 10.244.235.175
```

→ 파드에 대한 A 레코드 생성

<br/>

---

참고

- [쿠버네티스 입문](http://www.yes24.com/Product/Goods/85578606)
