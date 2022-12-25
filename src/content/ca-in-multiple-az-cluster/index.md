---
title: '다중 가용 영역 클러스터에 Cluster Autoscaler 도입하기'
date: '2022-12-26T02:13:42.635Z'
---

### 개요

고가용성을 위한 인프라 환경 제공이라는 주제로 프로젝트를 진행하면서 쿠버네티스 클러스터에 오토스케일러를 도입하였다.

먼저 `HPA`를 이용하여 파드 스케일링이 가능하도록 하였지만, 노드에 리소스가 없을 경우 스케일 아웃된 파드가 스케줄되지 못하고 `Pending` 상태에 남게 되는 문제가 발생하였다.

이를 해결하기 위해 `[Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)`를 도입하였다.

`Cluster Autoscaler`에 대해 간단히 설명하자면 클러스터의 상태를 감시하고 있다가 필요한 경우 클라우드 프로바이더의 오토스케일링 서비스를 이용하여 노드 스케일링을 진행한다.

`Cluster Autoscaler`를 도입하기 앞서 어떻게 적용할지 결정해야 했다.

AWS 환경에서 고가용성을 위해 3개의 가용 영역(AZ)에 걸쳐 쿠버네티스 클러스터를 구축하였는데, 애플리케이션 배포 방법과 오토스케일링 그룹(ASG)를 어떻게 묶느냐에 따라 달랐다.

다음과 같이 총 4가지 방법을 생각하였다.

- `1 AutoScalingGroup` + `1 Deployment`
- `1 AutoScalingGroup` + `3 Deployment`
- `3 AutoScalingGroup` + `1 Deployment`
- `3 AutoScalingGroup` + `3 Deployment`

결론을 내리기 위해 각 방법에 따라 가설을 세우고 테스트를 통한 검증 과정이 필요했다.

### 테스트 환경

- kubernetes v1.21.1
- Cluster Autoscaler v1.22.2
- 각 가용 영역에 2개의 worker 노드 배치(default)
- 원활한 테스트를 위해 파드 리소스 지정
  - 현재 설정으로 하나의 노드에 최대 3개 파드 배포 가능

### 가설 정의

- `1 AutoScalingGroup` + `1 Deployment`
  - 1개의 배포를 수행하여 자동으로 각 가용 영역에 균등하게 배포 가능
  - 하나의 배포만 관리
  - cluster autoscaler가 특정 가용 영역을 찾기 위한 오버헤드가 존재하지 않음
- `1 AutoScalingGroup` + `3 Deployment`
  - 3개의 배포를 수행하여 수동으로 각 가용 영역에 균등하게 배포 가능
  - 3개의 배포를 관리해야 하므로 관리 포인트가 증가(hpa도 3개 관리해야 함)
  - cluster autoscaler가 모든 가용 영역을 포함하는 하나의 asg를 관리하므로 스케일이 필요한 특정 가용 영역을 찾기 위한 오버헤드가 발생
    - 예) zone A에 스케일이 필요한 상태에서 cluster autoscaler는 zone A가 아닌 zone B 또는 zone C에 노드를 생성하여 파드 스케줄링이 지연됨
- `3 AutoScalingGroup` + `1 Deployment`
  - 1개의 배포를 수행하여 자동으로 각 가용 영역에 균등하게 배포 가능
  - 하나의 배포만 관리
  - 특정 가용 영역이 다운됐을 경우 self healing을 통해 다른 노드그룹으로 마이그레이션 가능
- `3 AutoScalingGroup` + `3 Deployment`
  - 3개의 배포를 수행하여 수동으로 각 가용 영역에 균등하게 배포 가능
  - 3개의 배포를 관리해야 하므로 관리 포인트가 증가(hpa도 3개 관리해야 함)
  - cluster autoscaler가 특정 가용 영역을 찾기 위한 오버헤드가 존재하지 않음
  - 특정 가용 영역이 다운됐을 경우 self healing되지 않음

### 가설 검증

- `1 AutoScalingGroup` + `1 Deployment`
  ![1asg + 1deploy](https://user-images.githubusercontent.com/59433441/209476487-f2750191-9fa0-4174-806b-6b5e989d25de.png)
  - 1개의 배포를 수행하여 자동으로 각 가용 영역에 균등하게 배포 가능
    각 가용 영역에 배포되도록 zone을 topology로 하는 `soft pod anti affinity` 적용(`hard affinity`를 적용할 경우 배포가 정상적으로 수행되지 않을 수도 있으므로)
    ```yaml
    # nginx-deploy.yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx-deploy
    spec:
      replicas: 6
      selector:
        matchLabels:
          app: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          affinity:
            podAntiAffinity:
              preferredDuringSchedulingIgnoredDuringExecution:
                - weight: 100
                  podAffinityTerm:
                    topologyKey: topology.kubernets.io/zone
                    labelSelector:
                      matchExpressions:
                        - key: app
                          operator: In
                          values:
                            - nginx
          containers:
            - name: nginx
              image: nginx
              resources:
                requests:
                  cpu: '500m'
                  memory: '256Mi'
                limits:
                  cpu: '500m'
                  memory: '256Mi'
              ports:
                - containerPort: 80
    ```
    가용 영역마다 균등하게 배포된 것 확인
    ```bash
    # k get po -o wide
    NAME                            READY   STATUS    RESTARTS   AGE   IP               NODE                                            NOMINATED NODE   READINESS GATES
    nginx-deploy-55d455cb69-56zjd   1/1     Running   0          13s   192.168.195.1    ip-10-0-5-174.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-55d455cb69-679xs   1/1     Running   0          13s   192.168.150.65   ip-10-0-4-94.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-55d455cb69-9rc6w   1/1     Running   0          13s   192.168.37.129   ip-10-0-4-89.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-55d455cb69-cxmz5   1/1     Running   0          13s   192.168.95.65    ip-10-0-5-243.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-55d455cb69-fwgf9   1/1     Running   0          13s   192.168.152.65   ip-10-0-3-169.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-55d455cb69-mddq2   1/1     Running   0          13s   192.168.50.193   ip-10-0-3-203.ap-northeast-2.compute.internal   <none>           <none>
    ```
  - 하나의 배포만 관리
    모든 가용 영역에 배포하기 위해 1개의 배포를 수행한다.
    ```bash
    # k get deploy
    NAME           READY   UP-TO-DATE   AVAILABLE   AGE
    nginx-deploy   6/6     6            6           9m8s
    ```
  - cluster autoscaler가 특정 가용 영역을 찾기 위한 오버헤드가 존재하지 않음
    테스트를 위해 레플리카 수 조정
    ```bash
    # k scale deploy nginx-deploy --replicas=21
    deployment.apps/nginx-deploy scaled
    ```
    파드를 스케줄링할 수 없자 cluster autoscaler가 이를 감지하고 스케일 아웃 진행
    ```bash
    # k get po |grep Pending
    nginx-deploy-5975cd4c6f-khvm4   0/1     Pending   0          4s
    nginx-deploy-5975cd4c6f-fzvs5   0/1     Pending   0          4s
    nginx-deploy-5975cd4c6f-cr89p   0/1     Pending   0          4s
    ```
    ```bash
    # k logs cluster-autoscaler-5fc547f877-6btxr -n kube-system
    ..
    I1223 12:28:45.755920       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000012 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 12:28:45.756018       1 scale_up.go:468] Best option to resize: terraform-20221223072925690300000012
    I1223 12:28:45.756102       1 scale_up.go:472] Estimated 1 nodes needed in terraform-20221223072925690300000012
    I1223 12:28:45.756171       1 scale_up.go:586] Final scale-up plan: [{terraform-20221223072925690300000012 6->7 (max: 12)}]
    I1223 12:28:45.756242       1 scale_up.go:675] Scale-up: setting group terraform-20221223072925690300000012 size to 7
    I1223 12:28:45.756323       1 auto_scaling_groups.go:219] Setting asg terraform-20221223072925690300000012 size to 7
    I1223 12:28:45.756770       1 event_sink_logging_wrapper.go:48] Event(v1.ObjectReference{Kind:"ConfigMap", Namespace:"kube-system", Name:"cluster-autoscaler-status", UID:"4b58a55c-87b4-43a7-9894-5e469cc3690f", APIVersion:"v1", ResourceVersion:"55421", FieldPath:""}): type: 'Normal' reason: 'ScaledUpGroup' Scale-up: setting group terraform-20221223072925690300000012 size to 7
    I1223 12:28:45.912416       1 eventing_scale_up_processor.go:47] Skipping event processing for unschedulable pods since there is a ScaleUp attempt this loop
    I1223 12:28:45.912866       1 event_sink_logging_wrapper.go:48] Event(v1.ObjectReference{Kind:"Pod", Namespace:"default", Name:"nginx-deploy-5975cd4c6f-khvm4", UID:"aed89bd2-7f3c-4a04-938e-8af952582c65", APIVersion:"v1", ResourceVersion:"55405", FieldPath:""}): type: 'Normal' reason: 'TriggeredScaleUp' pod triggered scale-up: [{terraform-20221223072925690300000012 6->7 (max: 12)}]
    I1223 12:28:45.936356       1 event_sink_logging_wrapper.go:48] Event(v1.ObjectReference{Kind:"Pod", Namespace:"default", Name:"nginx-deploy-5975cd4c6f-fzvs5", UID:"59200ce3-668b-4a33-902b-cce3511d77bf", APIVersion:"v1", ResourceVersion:"55412", FieldPath:""}): type: 'Normal' reason: 'TriggeredScaleUp' pod triggered scale-up: [{terraform-20221223072925690300000012 6->7 (max: 12)}]
    I1223 12:28:45.966979       1 event_sink_logging_wrapper.go:48] Event(v1.ObjectReference{Kind:"Pod", Namespace:"default", Name:"nginx-deploy-5975cd4c6f-cr89p", UID:"743556f7-8ca7-4db3-8d20-ace37a1d2738", APIVersion:"v1", ResourceVersion:"55414", FieldPath:""}): type: 'Normal' reason: 'TriggeredScaleUp' pod triggered scale-up: [{terraform-20221223072925690300000012 6->7 (max: 12)}]
    ..
    I1223 12:28:55.951121       1 static_autoscaler.go:231] Starting main loop
    I1223 12:28:55.952023       1 filter_out_schedulable.go:65] Filtering out schedulables
    I1223 12:28:55.952044       1 filter_out_schedulable.go:132] Filtered out 0 pods using hints
    I1223 12:28:55.952190       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-5975cd4c6f-khvm4 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-203101283895217702-upcoming-0. Ignoring in scale up.
    I1223 12:28:55.952337       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-5975cd4c6f-fzvs5 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-203101283895217702-upcoming-0. Ignoring in scale up.
    I1223 12:28:55.952419       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-5975cd4c6f-cr89p marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-203101283895217702-upcoming-0. Ignoring in scale up.
    I1223 12:28:55.952441       1 filter_out_schedulable.go:170] 0 pods were kept as unschedulable based on caching
    I1223 12:28:55.952450       1 filter_out_schedulable.go:171] 3 pods marked as unschedulable can be scheduled.
    ```
    cluster autoscaler가 노드를 생성하여 파드가 정상적으로 스케줄링 됨
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE     VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   4h59m   v1.21.1
    ip-10-0-3-169.ap-northeast-2.compute.internal   Ready    <none>                 4h27m   v1.21.1
    ip-10-0-3-203.ap-northeast-2.compute.internal   Ready    <none>                 4h29m   v1.21.1
    ip-10-0-4-89.ap-northeast-2.compute.internal    Ready    <none>                 4h25m   v1.21.1
    ip-10-0-4-94.ap-northeast-2.compute.internal    Ready    <none>                 4h25m   v1.21.1
    ip-10-0-5-174.ap-northeast-2.compute.internal   Ready    <none>                 4h26m   v1.21.1
    ip-10-0-5-190.ap-northeast-2.compute.internal   Ready    <none>                 117s    v1.21.1
    ip-10-0-5-243.ap-northeast-2.compute.internal   Ready    <none>                 4h29m   v1.21.1
    ```
    ```bash
    # k get po
    NAME                            READY   STATUS    RESTARTS   AGE
    nginx-deploy-5975cd4c6f-2mhkc   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-85gwz   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-8cgqw   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-8rzwx   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-cc4j9   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-cr89p   1/1     Running   0          3m47s
    nginx-deploy-5975cd4c6f-f44qx   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-fgh7p   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-fhgrm   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-fzvs5   1/1     Running   0          3m47s
    nginx-deploy-5975cd4c6f-g4dvn   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-gn598   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-gzvx5   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-hckgt   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-hfggr   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-hv5gt   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-jbbx4   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-khvm4   1/1     Running   0          3m47s
    nginx-deploy-5975cd4c6f-mgxp8   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-psxsl   1/1     Running   0          14m
    nginx-deploy-5975cd4c6f-sl9hc   1/1     Running   0          14m
    ```
- `1 AutoScalingGroup` + `3 Deployment`
  ![1asg + 3deploy](https://user-images.githubusercontent.com/59433441/209476489-0a37fe55-4141-4096-9ba7-96b22a768836.png)
  - 3개의 배포를 수행하여 수동으로 각 가용 영역에 균등하게 배포 가능
    각 가용 영역에 배포되도록 zone을 topology로 하는 `hard node affinity` 적용(해당 배포는 특정 영역에만 배포되어야 하기 때문에)
    ```yaml
    # nginx-deploy-a.yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx-deploy-a
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          affinity:
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: topology.kubernetes.io/zone
                        operator: In
                        values:
                          - ap-northeast-2a
          containers:
            - name: nginx
              image: nginx
              resources:
                requests:
                  cpu: '500m'
                  memory: '256Mi'
                limits:
                  cpu: '500m'
                  memory: '256Mi'
              ports:
                - containerPort: 80
    ```
    가용 영역마다 균등하게 배포된 것 확인
    ```bash
    # k get po -o wide
    NAME                              READY   STATUS    RESTARTS   AGE   IP               NODE                                            NOMINATED NODE   READINESS GATES
    nginx-deploy-a-5587c665fb-8ql7s   1/1     Running   0          27s   192.168.50.196   ip-10-0-3-203.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-hd7fq   1/1     Running   0          24s   192.168.152.68   ip-10-0-3-169.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-b-58f74dd7b9-4sn6f   1/1     Running   0          21s   192.168.37.132   ip-10-0-4-89.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-b-58f74dd7b9-nqgsj   1/1     Running   0          24s   192.168.150.68   ip-10-0-4-94.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-c-75764c77db-6ltk8   1/1     Running   0          22s   192.168.95.68    ip-10-0-5-243.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-c-75764c77db-x62pt   1/1     Running   0          18s   192.168.195.4    ip-10-0-5-174.ap-northeast-2.compute.internal   <none>           <none>
    ```
  - 3개의 배포를 관리해야 하므로 관리 포인트가 증가
    모든 가용 영역에 배포하기 위해 3개의 배포를 수행해야 한다.
    ```bash
    # k get deploy
    NAME             READY   UP-TO-DATE   AVAILABLE   AGE
    nginx-deploy-a   2/2     2            2           28m
    nginx-deploy-b   2/2     2            2           27m
    nginx-deploy-c   2/2     2            2           27m
    ```
  - cluster autoscaler가 모든 가용 영역을 포함하는 하나의 asg를 관리하므로 스케일이 필요한 특정 가용 영역을 찾기 위한 오버헤드가 발생
    테스트를 위해 zone C에 레플리카 수 조정
    ```bash
    # k scale deploy nginx-deploy-c --replicas=9
    deployment.apps/nginx-deploy-c scaled
    ```
    파드를 스케줄링할 수 없자 cluster autoscaler가 이를 감지하고 스케일 아웃 진행
    ```bash
    # k logs cluster-autoscaler-5fc547f877-6btxr -n kube-system
    ..
    I1223 09:47:24.484810       1 static_autoscaler.go:231] Starting main loop
    I1223 09:47:24.485570       1 static_autoscaler.go:335] 1 unregistered nodes present
    I1223 09:47:24.485833       1 filter_out_schedulable.go:65] Filtering out schedulables
    I1223 09:47:24.485966       1 filter_out_schedulable.go:132] Filtered out 0 pods using hints
    I1223 09:47:24.486201       1 filter_out_schedulable.go:170] 0 pods were kept as unschedulable based on caching
    I1223 09:47:24.486278       1 filter_out_schedulable.go:171] 0 pods marked as unschedulable can be scheduled.
    I1223 09:47:24.486355       1 filter_out_schedulable.go:82] No schedulable pods
    I1223 09:47:24.486417       1 klogx.go:86] Pod default/nginx-deploy-c-75764c77db-z9ccc is unschedulable
    I1223 09:47:24.486482       1 klogx.go:86] Pod default/nginx-deploy-c-75764c77db-cq4b7 is unschedulable
    I1223 09:47:24.486542       1 klogx.go:86] Pod default/nginx-deploy-c-75764c77db-z55mb is unschedulable
    I1223 09:47:24.486691       1 scale_up.go:376] Upcoming 1 nodes
    I1223 09:47:24.486843       1 scale_up.go:300] Pod nginx-deploy-c-75764c77db-z9ccc can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 09:47:24.486952       1 scale_up.go:300] Pod nginx-deploy-c-75764c77db-cq4b7 can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 09:47:24.487035       1 scale_up.go:300] Pod nginx-deploy-c-75764c77db-z55mb can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 09:47:24.487101       1 scale_up.go:449] No pod can fit to terraform-20221223072925690300000012
    ```
    cluster autoscaler가 스케일링 했지만 zone C가 아닌 zone B에 노드를 생성하여 파드는 여전히 pending 상태
    ```bash
    # k get no
    NAME                                            STATUS     ROLES                  AGE     VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready      control-plane,master   135m    v1.21.1
    ip-10-0-3-169.ap-northeast-2.compute.internal   Ready      <none>                 103m    v1.21.1
    ip-10-0-3-203.ap-northeast-2.compute.internal   Ready      <none>                 105m    v1.21.1
    ip-10-0-4-241.ap-northeast-2.compute.internal   Ready      <none>                 3m19s   v1.21.1
    ip-10-0-4-89.ap-northeast-2.compute.internal    Ready      <none>                 101m    v1.21.1
    ip-10-0-4-94.ap-northeast-2.compute.internal    Ready      <none>                 101m    v1.21.1
    ip-10-0-5-174.ap-northeast-2.compute.internal   Ready      <none>                 103m    v1.21.1
    ip-10-0-5-243.ap-northeast-2.compute.internal   Ready      <none>                 105m    v1.21.1
    ```
    ```bash
    root@ip-10-0-3-100:~# k get po |grep Pending
    NAME                              READY   STATUS    RESTARTS   AGE
    nginx-deploy-c-75764c77db-cq4b7   0/1     Pending   0          4m31s
    nginx-deploy-c-75764c77db-z55mb   0/1     Pending   0          4m31s
    nginx-deploy-c-75764c77db-z9ccc   0/1     Pending   0          4m31s
    ```
    결국 cluster autoscaler가 노드를 하나 더 생성
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE     VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   137m    v1.21.1
    ip-10-0-3-169.ap-northeast-2.compute.internal   Ready    <none>                 105m    v1.21.1
    ip-10-0-3-203.ap-northeast-2.compute.internal   Ready    <none>                 107m    v1.21.1
    ip-10-0-4-241.ap-northeast-2.compute.internal   Ready    <none>                 5m39s   v1.21.1
    ip-10-0-4-89.ap-northeast-2.compute.internal    Ready    <none>                 103m    v1.21.1
    ip-10-0-4-94.ap-northeast-2.compute.internal    Ready    <none>                 103m    v1.21.1
    ip-10-0-5-174.ap-northeast-2.compute.internal   Ready    <none>                 105m    v1.21.1
    ip-10-0-5-243.ap-northeast-2.compute.internal   Ready    <none>                 107m    v1.21.1
    ip-10-0-5-80.ap-northeast-2.compute.internal    Ready    <none>                 2m37s   v1.21.1
    ```
    이제서야 모든 파드가 스케줄링 됨
    ```bash
    # k get po |grep nginx-deploy-c
    NAME                              READY   STATUS    RESTARTS   AGE
    nginx-deploy-c-75764c77db-6ltk8   1/1     Running   0          31m
    nginx-deploy-c-75764c77db-bjn4n   1/1     Running   0          8m
    nginx-deploy-c-75764c77db-cq4b7   1/1     Running   0          7m31s
    nginx-deploy-c-75764c77db-fb87j   1/1     Running   0          8m
    nginx-deploy-c-75764c77db-nd7nz   1/1     Running   0          8m
    nginx-deploy-c-75764c77db-pqwlt   1/1     Running   0          8m
    nginx-deploy-c-75764c77db-x62pt   1/1     Running   0          31m
    nginx-deploy-c-75764c77db-z55mb   1/1     Running   0          7m31s
    nginx-deploy-c-75764c77db-z9ccc   1/1     Running   0          7m31s
    ```
- `3 AutoScalingGroup` + `1 Deployment`
  ![3asg + 1deploy](https://user-images.githubusercontent.com/59433441/209476490-c08f69ce-95d6-46e8-9a42-a23ec44f63e9.png)
  - 1개의 배포를 수행하여 자동으로 각 가용 영역에 균등하게 배포 가능
    `1 AutoScalingGroup` + `1 Deployment` 방법과 같은 방식으로 배포
  - 하나의 배포만 관리
    모든 가용 영역에 배포하기 위해 1개의 배포를 수행한다.
    ```bash
    # k get deploy
    NAME           READY   UP-TO-DATE   AVAILABLE   AGE
    nginx-deploy   6/6     6            6           26s
    ```
  - 특정 가용 영역이 다운됐을 경우 self healing을 통해 다른 노드그룹으로 이동 가능
    특정 가용 영역 다운(zone C에 설정한 asg 삭제)
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE     VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   9h      v1.21.1
    ip-10-0-3-116.ap-northeast-2.compute.internal   Ready    <none>                 25m     v1.21.1
    ip-10-0-3-38.ap-northeast-2.compute.internal    Ready    <none>                 173m    v1.21.1
    ip-10-0-4-142.ap-northeast-2.compute.internal   Ready    <none>                 14m     v1.21.1
    ip-10-0-4-186.ap-northeast-2.compute.internal   Ready    <none>                 8m12s   v1.21.1
    ```
    해당 가용 영역에서 실행 중이던 노드가 다운되면서 파드가 self healing되고 노드에 리소스가 부족하여 pending 상태가 됨
    ```bash
    # k get po -o wide
    NAME                            READY   STATUS    RESTARTS   AGE     IP                NODE                                            NOMINATED NODE   READINESS GATES
    nginx-deploy-78d865fc9b-2wbft   0/1     Pending   0          5s      <none>            <none>                                          <none>           <none>
    nginx-deploy-78d865fc9b-57gsg   1/1     Running   0          2m34s   192.168.60.205    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-5nrrt   1/1     Running   0          7m37s   192.168.113.193   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-7c7zw   1/1     Running   0          2m34s   192.168.161.7     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-cb8z5   0/1     Pending   0          5s      <none>            <none>                                          <none>           <none>
    nginx-deploy-78d865fc9b-dnp9k   1/1     Running   0          2m34s   192.168.113.194   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-gbhgv   1/1     Running   0          7m37s   192.168.60.203    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-kbg9j   0/1     Pending   0          4s      <none>            <none>                                          <none>           <none>
    nginx-deploy-78d865fc9b-kcgrn   1/1     Running   0          2m34s   192.168.60.204    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-l5nzg   1/1     Running   0          7m37s   192.168.218.1     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-lfsnz   1/1     Running   0          2m34s   192.168.218.3     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-m66r9   1/1     Running   0          2m34s   192.168.218.2     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-t4wmb   1/1     Running   0          7m37s   192.168.161.5     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-tnjpr   1/1     Running   0          2m34s   192.168.113.195   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-v8r87   0/1     Pending   0          5s      <none>            <none>                                          <none>           <none>
    nginx-deploy-78d865fc9b-wblfl   0/1     Pending   0          5s      <none>            <none>                                          <none>           <none>
    nginx-deploy-78d865fc9b-ww2rm   1/1     Running   0          2m34s   192.168.161.6     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-zvjmm   0/1     Pending   0          5s      <none>            <none>                                          <none>           <none>
    ```
    cluster autoscaler가 이를 감지하고 스케일 진행
    ```bash
    # k logs cluster-autoscaler-5fc547f877-6btxr -n kube-system
    ..
    I1223 16:40:56.706010       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-v8r87 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-0. Ignoring in scale up.
    I1223 16:40:56.706288       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-2wbft marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-0. Ignoring in scale up.
    I1223 16:40:56.706359       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-wblfl marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-0. Ignoring in scale up.
    I1223 16:40:56.706607       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-kbg9j marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-1. Ignoring in scale up.
    I1223 16:40:56.706682       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-zvjmm marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-1. Ignoring in scale up.
    I1223 16:40:56.706901       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-cb8z5 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-3178448486295206162-upcoming-1. Ignoring in scale up.
    I1223 16:40:56.706930       1 filter_out_schedulable.go:170] 0 pods were kept as unschedulable based on caching
    I1223 16:40:56.706940       1 filter_out_schedulable.go:171] 6 pods marked as unschedulable can be scheduled.
    ```
    cluster autoscaler가 노드를 생성하여 파드가 정상적으로 스케줄링 됨
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE    VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   9h     v1.21.1
    ip-10-0-3-111.ap-northeast-2.compute.internal   Ready    <none>                 2m     v1.21.1
    ip-10-0-3-116.ap-northeast-2.compute.internal   Ready    <none>                 30m    v1.21.1
    ip-10-0-3-160.ap-northeast-2.compute.internal   Ready    <none>                 2m     v1.21.1
    ip-10-0-3-38.ap-northeast-2.compute.internal    Ready    <none>                 178m   v1.21.1
    ip-10-0-4-142.ap-northeast-2.compute.internal   Ready    <none>                 18m    v1.21.1
    ip-10-0-4-186.ap-northeast-2.compute.internal   Ready    <none>                 12m    v1.21.1
    ```
    ```bash
    # k get po -o wide
    NAME                            READY   STATUS    RESTARTS   AGE     IP                NODE                                            NOMINATED NODE   READINESS GATES
    nginx-deploy-78d865fc9b-2wbft   1/1     Running   0          4m29s   192.168.28.2      ip-10-0-3-111.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-57gsg   1/1     Running   0          6m58s   192.168.60.205    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-5nrrt   1/1     Running   0          12m     192.168.113.193   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-7c7zw   1/1     Running   0          6m58s   192.168.161.7     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-cb8z5   1/1     Running   0          4m29s   192.168.28.3      ip-10-0-3-111.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-dnp9k   1/1     Running   0          6m58s   192.168.113.194   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-gbhgv   1/1     Running   0          12m     192.168.60.203    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-kbg9j   1/1     Running   0          4m28s   192.168.52.2      ip-10-0-3-160.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-kcgrn   1/1     Running   0          6m58s   192.168.60.204    ip-10-0-3-38.ap-northeast-2.compute.internal    <none>           <none>
    nginx-deploy-78d865fc9b-l5nzg   1/1     Running   0          12m     192.168.218.1     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-lfsnz   1/1     Running   0          6m58s   192.168.218.3     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-m66r9   1/1     Running   0          6m58s   192.168.218.2     ip-10-0-4-186.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-t4wmb   1/1     Running   0          12m     192.168.161.5     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-tnjpr   1/1     Running   0          6m58s   192.168.113.195   ip-10-0-4-142.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-v8r87   1/1     Running   0          4m29s   192.168.52.3      ip-10-0-3-160.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-wblfl   1/1     Running   0          4m29s   192.168.28.1      ip-10-0-3-111.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-ww2rm   1/1     Running   0          6m58s   192.168.161.6     ip-10-0-3-116.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-78d865fc9b-zvjmm   1/1     Running   0          4m29s   192.168.52.1      ip-10-0-3-160.ap-northeast-2.compute.internal   <none>           <none>
    ```
    예상과 달리 zone A에 노드가 2개 생성됨
    현재 zone A에는 노드가 4개, zone B에는 노드가 2개 존재
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE    VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   9h     v1.21.1
    ip-10-0-3-111.ap-northeast-2.compute.internal   Ready    <none>                 2m     v1.21.1
    ip-10-0-3-116.ap-northeast-2.compute.internal   Ready    <none>                 30m    v1.21.1
    ip-10-0-3-160.ap-northeast-2.compute.internal   Ready    <none>                 2m     v1.21.1
    ip-10-0-3-38.ap-northeast-2.compute.internal    Ready    <none>                 178m   v1.21.1
    ip-10-0-4-142.ap-northeast-2.compute.internal   Ready    <none>                 18m    v1.21.1
    ip-10-0-4-186.ap-northeast-2.compute.internal   Ready    <none>                 12m    v1.21.1
    ```
    `--balance-similar-node-groups` 옵션을 이용하여 이를 해결 가능
    ```yaml
    # cluster-autoscaler.yaml
    		...
    		spec:
    			containers:
            - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.22.2
              name: cluster-autoscaler
              command:
                - ./cluster-autoscaler
                - --v=4
                - --stderrthreshold=info
                - --cloud-provider=aws
                - --skip-nodes-with-local-storage=false
                - --balance-similar-node-groups  # 옵션 추가
    ```
    다시 테스트를 수행해보면 옵션이 적용되어 균형을 맞춰 노드가 생성되고 self healing 진행
    ```bash
    # k logs cluster-autoscaler-5fbf84697-jlq6w -n kube-system
    ..
    I1223 17:02:11.289518       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-q4s72 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-6177026811335423860-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.289639       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-58ch8 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-6177026811335423860-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.289775       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-jh65t marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000012-6177026811335423860-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.289915       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-s8gjh marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000013-7979830878773245174-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.290011       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-l8dl4 marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000013-7979830878773245174-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.290110       1 filter_out_schedulable.go:157] Pod default.nginx-deploy-78d865fc9b-m6vxq marked as unschedulable can be scheduled on node template-node-for-terraform-20221223072925690300000013-7979830878773245174-upcoming-0. Ignoring in scale up.
    I1223 17:02:11.290158       1 filter_out_schedulable.go:170] 0 pods were kept as unschedulable based on caching
    I1223 17:02:11.290169       1 filter_out_schedulable.go:171] 6 pods marked as unschedulable can be scheduled.
    ```
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE     VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   9h      v1.21.1
    ip-10-0-3-111.ap-northeast-2.compute.internal   Ready    <none>                 22m     v1.21.1
    ip-10-0-3-125.ap-northeast-2.compute.internal   Ready    <none>                 2m39s   v1.21.1
    ip-10-0-3-38.ap-northeast-2.compute.internal    Ready    <none>                 3h18m   v1.21.1
    ip-10-0-4-133.ap-northeast-2.compute.internal   Ready    <none>                 2m53s   v1.21.1
    ip-10-0-4-142.ap-northeast-2.compute.internal   Ready    <none>                 39m     v1.21.1
    ip-10-0-4-186.ap-northeast-2.compute.internal   Ready    <none>                 33m     v1.21.1
    ```
    스케일 아웃도 `--balance-similar-node-groups` 옵션이 존재하지 않으면 특정 가용 영역에만 노드가 생성됨
    ```bash
    # k logs cluster-autoscaler-5fc547f877-n4sjr -n kube-system
    ..
    # 현재 expander 옵션으로 least-waste 사용
    I1223 17:13:41.549539       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000012 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 17:13:41.549562       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000013 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 17:13:41.549576       1 scale_up.go:468] Best option to resize: terraform-20221223072925690300000013
    I1223 17:13:41.549586       1 scale_up.go:472] Estimated 2 nodes needed in terraform-20221223072925690300000013
    I1223 17:13:41.549608       1 scale_up.go:586] Final scale-up plan: [{terraform-20221223072925690300000013 2->4 (max: 4)}]
    I1223 17:13:41.549634       1 scale_up.go:675] Scale-up: setting group terraform-20221223072925690300000013 size to 4
    I1223 17:13:41.549665       1 auto_scaling_groups.go:219] Setting asg terraform-20221223072925690300000013 size to 4
    ```
    마찬가지로 `--balance-similar-node-groups` 옵션 적용 후 균형을 맞춰 스케일 아웃 진행
    ```bash
    # k logs cluster-autoscaler-5fbf84697-pkx9r -n kub
    ..
    # 현재 expander 옵션으로 least-waste 사용
    I1223 17:29:42.923429       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000013 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 17:29:42.923564       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000012 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 17:29:42.923639       1 scale_up.go:468] Best option to resize: terraform-20221223072925690300000013
    I1223 17:29:42.923699       1 scale_up.go:472] Estimated 2 nodes needed in terraform-20221223072925690300000013
    I1223 17:29:42.923806       1 scale_up.go:578] Splitting scale-up between 2 similar node groups: {terraform-20221223072925690300000013, terraform-20221223072925690300000012}
    I1223 17:29:42.923885       1 scale_up.go:586] Final scale-up plan: [{terraform-20221223072925690300000013 2->3 (max: 4)} {terraform-20221223072925690300000012 2->3 (max: 4)}]
    I1223 17:29:42.923947       1 scale_up.go:675] Scale-up: setting group terraform-20221223072925690300000013 size to 3
    I1223 17:29:42.924047       1 auto_scaling_groups.go:219] Setting asg terraform-20221223072925690300000013 size to 3
    ```
    공식문서에 따르면 `--balance-similar-node-groups` 옵션을 이용하여 topolgy scheduling 없이도 node group의 균형을 맞추는 것이 가능하다고 함
- `3 AutoScalingGroup` + `3 Deployment`
  ![3asg + 3deploy](https://user-images.githubusercontent.com/59433441/209476491-4db1fca8-8330-4101-849e-7acb4f53404c.png)
  - 3개의 배포를 수행하여 수동으로 각 가용 영역에 균등하게 배포 가능
    `1 AutoScalingGroup` + `3 Deployment` 방법과 같은 방식으로 배포
  - 3개의 배포를 관리해야 하므로 관리 포인트가 증가(hpa도 3개 관리해야 함)
    ```bash
    # k get deploy
    NAME             READY   UP-TO-DATE   AVAILABLE   AGE
    nginx-deploy-a   2/2     2            2           44s
    nginx-deploy-b   2/2     2            2           42s
    nginx-deploy-c   2/2     2            2           38s
    ```
  - cluster autoscaler가 특정 가용 영역을 찾기 위한 오버헤드가 존재하지 않음
    위의 `1 AutoScalingGroup` + `3 Deployment`와 달리 개별 asg를 갖고 있으므로 cluster autoscaler가 스케일 아웃을 여러번 시도하지 않아도 됨
    테스트를 위해 zone B에 레플리카 수 조정
    ```bash
    # k scale deploy nginx-deploy-b --replicas=9
    deployment.apps/nginx-deploy-b scaled
    ```
    개별 배포를 수행했으므로 `--balance-similar-node-groups` 옵션이 없어도 됨
    ```bash
    # k logs cluster-autoscaler-5fbf84697-pkx9r -n kube-system
    ..
    I1223 17:44:57.343385       1 klogx.go:86] Pod default/nginx-deploy-b-58f74dd7b9-8jbzx is unschedulable
    I1223 17:44:57.343391       1 klogx.go:86] Pod default/nginx-deploy-b-58f74dd7b9-lcvw5 is unschedulable
    I1223 17:44:57.343397       1 klogx.go:86] Pod default/nginx-deploy-b-58f74dd7b9-gfvxm is unschedulable
    I1223 17:44:57.343449       1 scale_up.go:376] Upcoming 0 nodes
    # 먼저 zone A에 스케일이 가능한지 검사하지만 node affinity 설정으로 인해 스케줄링 될 수 없음
    I1223 17:44:57.343533       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-gfvxm can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 17:44:57.343556       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-8jbzx can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 17:44:57.343581       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-lcvw5 can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 17:44:57.343605       1 scale_up.go:449] No pod can fit to terraform-20221223072925690300000012
    # 현재 expander 옵션으로 least-waste 사용
    I1223 17:44:57.343843       1 waste.go:57] Expanding Node Group terraform-20221223072925690300000013 would waste 25.00% CPU, 80.12% Memory, 52.56% Blended
    I1223 17:44:57.343871       1 scale_up.go:468] Best option to resize: terraform-20221223072925690300000013
    I1223 17:44:57.343882       1 scale_up.go:472] Estimated 1 nodes needed in terraform-20221223072925690300000013
    I1223 17:44:57.343934       1 scale_up.go:655] No info about pods passing predicates found for group terraform-20221223072925690300000012, skipping it from scale-up consideration
    # zone B에 스케일 아웃 진행
    I1223 17:44:57.343948       1 scale_up.go:586] Final scale-up plan: [{terraform-20221223072925690300000013 2->3 (max: 4)}]
    I1223 17:44:57.343963       1 scale_up.go:675] Scale-up: setting group terraform-20221223072925690300000013 size to 3
    I1223 17:44:57.344167       1 auto_scaling_groups.go:219] Setting asg terraform-20221223072925690300000013 size to 3
    ```
  - 특정 가용 영역이 다운됐을 경우 self healing되지 않음
    특정 가용 영역 다운(zone B에 설정한 asg 삭제)
    ```bash
    # k get no
    NAME                                            STATUS   ROLES                  AGE   VERSION
    ip-10-0-3-100.ap-northeast-2.compute.internal   Ready    control-plane,master   10h   v1.21.1
    ip-10-0-3-125.ap-northeast-2.compute.internal   Ready    <none>                 55m   v1.21.1
    ip-10-0-3-143.ap-northeast-2.compute.internal   Ready    <none>                 25m   v1.21.1
    ip-10-0-5-106.ap-northeast-2.compute.internal   Ready    <none>                 46m   v1.21.1
    ip-10-0-5-9.ap-northeast-2.compute.internal     Ready    <none>                 46m   v1.21.1
    ```
    해당 가용 영역에서 실행 중이던 노드가 다운되면서 self healing을 시도하지만 개별 배포를 진행했으므로 마이그레이션 되지 않음
    ```bash
    # k get po -o wide
    NAME                              READY   STATUS    RESTARTS   AGE     IP                NODE                                            NOMINATED NODE   READINESS GATES
    nginx-deploy-a-5587c665fb-dsqhj   1/1     Running   0          9m25s   192.168.157.205   ip-10-0-3-125.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-gnltb   1/1     Running   0          9m25s   192.168.157.206   ip-10-0-3-125.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-gtj9w   1/1     Running   0          9m25s   192.168.144.69    ip-10-0-3-143.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-l9kz9   1/1     Running   0          21m     192.168.157.204   ip-10-0-3-125.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-pmcmk   1/1     Running   0          21m     192.168.144.68    ip-10-0-3-143.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-a-5587c665fb-t22n6   1/1     Running   0          9m25s   192.168.144.70    ip-10-0-3-143.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-b-58f74dd7b9-75s8l   0/1     Pending   0          27s     <none>            <none>                                          <none>           <none>
    nginx-deploy-b-58f74dd7b9-9hzvt   0/1     Pending   0          27s     <none>            <none>                                          <none>           <none>
    nginx-deploy-b-58f74dd7b9-dgmq9   0/1     Pending   0          27s     <none>            <none>                                          <none>           <none>
    nginx-deploy-b-58f74dd7b9-m6v42   0/1     Pending   0          47s     <none>            <none>                                          <none>           <none>
    nginx-deploy-b-58f74dd7b9-pqcpm   0/1     Pending   0          47s     <none>            <none>                                          <none>           <none>
    nginx-deploy-b-58f74dd7b9-qk5rs   0/1     Pending   0          47s     <none>            <none>                                          <none>           <none>
    nginx-deploy-c-75764c77db-67vnw   1/1     Running   0          9m22s   192.168.199.140   ip-10-0-5-9.ap-northeast-2.compute.internal     <none>           <none>
    nginx-deploy-c-75764c77db-8zh45   1/1     Running   0          9m22s   192.168.77.139    ip-10-0-5-106.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-c-75764c77db-bcdcd   1/1     Running   0          9m23s   192.168.77.138    ip-10-0-5-106.ap-northeast-2.compute.internal   <none>           <none>
    nginx-deploy-c-75764c77db-fz4zq   1/1     Running   0          9m22s   192.168.199.139   ip-10-0-5-9.ap-northeast-2.compute.internal     <none>           <none>
    nginx-deploy-c-75764c77db-lc9z2   1/1     Running   0          21m     192.168.199.138   ip-10-0-5-9.ap-northeast-2.compute.internal     <none>           <none>
    nginx-deploy-c-75764c77db-slwwm   1/1     Running   0          21m     192.168.77.137    ip-10-0-5-106.ap-northeast-2.compute.internal   <none>           <none>
    ```
    cluster autoscaler도 스케일 아웃 가능한 asg를 찾을 수 없음(상태 유지)
    ```bash
    # k logs cluster-autoscaler-5fbf84697-pkx9r -n kube-system
    ..
    I1223 18:01:31.932937       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-m6v42 can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933117       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-qk5rs can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933202       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-pqcpm can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933325       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-9hzvt can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933418       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-75s8l can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933499       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-dgmq9 can't be scheduled on terraform-20221223072925690300000012, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933593       1 scale_up.go:449] No pod can fit to terraform-20221223072925690300000012
    I1223 18:01:31.933755       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-m6v42 can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933854       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-qk5rs can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.933945       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-pqcpm can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.934034       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-9hzvt can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.934110       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-75s8l can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.934189       1 scale_up.go:300] Pod nginx-deploy-b-58f74dd7b9-dgmq9 can't be scheduled on terraform-20221223072925690300000014, predicate checking error: node(s) didn't match Pod's node affinity/selector; predicateName=NodeAffinity; reasons: node(s) didn't match Pod's node affinity/selector; debugInfo=
    I1223 18:01:31.934273       1 scale_up.go:449] No pod can fit to terraform-20221223072925690300000014
    ```

### 결론

- 개별 배포가 필요하지 않은 경우라면 하나의 배포를 수행한다.
  - 개별 배포를 수행할 경우 관리 지점이 늘어난다.
  - 가용 영역 별로 세밀한 배포가 필요한 경우에는 개별 배포를 수행한다.
- 각 가용 영역에 개별 배포가 필요한 경우(예: PV로 AWS EBS를 사용하는 경우) 3개의 ASG를 이용한다.
  - 하나의 ASG를 이용할 경우 Cluster Autoscaler가 스케일이 필요한 가용 영역을 찾는데 오버헤드가 발생한다.
- 모든 가용 영역에 하나의 배포를 수행할 경우 1개 또는 3개의 ASG를 사용할 수 있다.
  - 1개의 ASG를 이용할 경우 AWS ASG에 의존하여 스케일링 한다.
    - 기본적으로 AWS ASG는 가용 영역 간의 노드 수 균형을 유지하며 스케일링 한다.
  - 3개의 ASG를 이용할 경우 Cluster Autoscaler에 의존하여 스케일링 한다.
    - Cluster Autoscaler의 `--balance-similar-node-groups` 옵션을 이용하여 가용 영역 간의 노드 수 균형을 유지할 수 있다.
