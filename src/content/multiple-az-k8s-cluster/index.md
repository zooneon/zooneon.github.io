---
title: '다중 가용 영역 기반의 쿠버네티스 클러스터'
date: '2022-11-12T22:11:20.635Z'
tags: ['kubernetes', 'ha']
---

## 개요

카카오클라우드 스쿨에서 다중 가용 영역 기반의 쿠버네티스 클러스터 구축 프로젝트를 진행하고 있다.

아키텍처를 설계하기 위해 자료를 찾으면서 정리한 내용들을 기록해보려 한다.

## 왜 여러 개의 Availability Zone에 클러스터를 구축해야 할까?

하나의 Availability Zone에 쿠버네티스 클러스터를 구축하는 것은 node failure가 발생해도 안정적으로 서비스를 운영할 수 있지만 zone failure에 대한 가용성은 보장하지 않는다.

따라서 zone failure가 발생해도 안정적으로 서비스를 운영하기 위해서는 다중 Availability Zone을 이용해야 한다.

## 왜 3개의 Availability Zone을 이용할까?

우선 쿠버네티스 [공식문서](https://kubernetes.io/docs/setup/best-practices/multiple-zones/)에 따르면 쿠버네티스를 multiple zone에서 운영할 경우 control plane은 각기 다른 zone에 있어야 하고, 가용성이 우선이라면 적어도 3개의 zone을 선택할 것을 권장하고 있다.

또한 AWS의 EKS도 [고가용성 아키텍처](https://aws.amazon.com/ko/quickstart/architecture/amazon-eks/)를 위해 3개의 Availability Zone을 이용하고 있다.

마지막으로 etcd의 Raft 알고리즘을 고려해야 한다.

쿠버네티스는 backing storage로 etcd를 이용한다.

HA를 위해서 etcd를 컴포넌트로 갖고 있는 control plane 또한 클러스터링 해줘야 하는데 2대의 control plane을 클러스터링 하는 것은 HA에 도움이 되지 않는다.

이는 위에서 언급한 Raft 알고리즘과 관련이 있는데, 2대의 etcd에서 leader election을 수행하기 위해서는 etcd quorum이 2`(2/2+1)`를 만족해야 한다.

만약 여기서 1대의 etcd 서버가 죽게 되면 quorum을 만족할 수 없으므로 leader election에 실패하게 되고 결국 클러스터 전체에 장애가 발생하게 된다.

따라서 적어도 3대의 etcd 서버를 클러스터링 해야 하고, 하나의 Availability Zone이 outage되어도 가용성을 유지하기 위해선 3개의 zone을 이용해야 한다.

(하나의 zone에 2대, 나머지 zone에 1대를 둘 경우 2대를 보유하고 있는 zone이 outage될 경우 마찬가지로 quorum을 만족하지 못하므로 장애가 발생한다.)

물론 더 많은 Availability Zone을 이용하면 더 높은 가용성을 보장 받을 수 있지만 그만큼의 비용이 증가하게 된다.

(참고로 etcd [공식문서](https://etcd.io/docs/v3.5/faq/#what-is-maximum-cluster-size)에서는 최대 클러스터 사이즈로 5를 권장하고 있다.)

## 다중 AZ에서 노드들을 클러스터링 하는 방법

### Availability Zone bounded Auto Scaling groups

![asg1](https://user-images.githubusercontent.com/59433441/201475612-e1a3937e-ba16-48d4-823c-a0246e1b99b3.png)

각 AZ에 하나의 ASG를 생성하는 방법이다.

스토리지로 EBS를 사용하는 경우에 사용한다.

EBS의 경우 [EC2와 같은 zone에 있어야 하므로](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-volumes.html) Auto Scaling Group을 각 AZ마다 생성할 수 있다.

(물론 여러 AZ에 하나의 ASG를 생성할 수 있지만 이에 따른 문제는 아래에 작성하였다.)

worker 노드 그룹(하나의 ASG)에서 레이블을 사용하여 해당 가용 영역의 노드에 pod를 예약할 수 있다.

레이블(`topology.kubernetes.io/zone=ap-northeast-2b`)은 kubernetes cloud provider를 통해 노드에 자동으로 추가되고 AWS EBS CSI 드라이버를 통해 PersistentVolume에 자동으로 추가된다.

EBS 볼륨을 사용하는 pod가 reschedule되거나 인스턴스가 종료되는 경우 pod에 topology 레이블과 일치하는 nodeSelector가 있는지 확인해야 하며 각 AZ에 대해 별도의 배포를 실행해야 할 수 있다.

(해당 AZ의 볼륨을 사용하는 pod의 경우 nodeSelector를 통해 AZ를 명시해야 하며 이를 위해 AZ에 대해 별도의 배포가 실행될 수 있다.)

AZ당 ASG가 필요한 이유는 특정 AZ에 충분한 컴퓨팅 용량이 없고 pod를 scheduling 해야 하는 경우(ap-northeast-2b가 최대 용량이고 pod가 해당 AZ의 EBS 볼륨에 대한 액세스 권한으로 실행되어야 하는 경우) cluster autoscaler가 해당 AZ에 리소스를 추가할 수 있어야 하기 때문이다.

여러 AZ에 걸쳐 있는 하나의 ASG를 실행하는 경우 cluster autoscaler는 특정 AZ 에 인스턴스를 생성하도록 제어할 수 없다.

따라서 cluster autoscaler는 ASG에 리소스를 추가할 수 있지만 리소스가 필요한 특정 AZ를 구분할 수 없으므로 올바른 AZ에 인스턴스가 생성되기 위해 여러 번 시도될 수 있다.

AZ가 다운되는 경우 해당 AZ의 EBS 볼륨을 사용할 수 없으며 해당 볼륨을 요청하는 pod는 schedule되지 않는다.

AZ당 ASG를 사용하는 경우 각 ASG를 확장하도록 AZ마다 cluster autoscaler를 구성해야 한다.

이와 같이 AZ당 ASG를 실행하면 더 많은 ASG와 더 많은 배포(AZ당 하나)를 관리해야 하는 추가 오버헤드가 발생한다.

### Region bounded Auto Scaling groups

![asg2](https://user-images.githubusercontent.com/59433441/201475622-ad4682b4-a4d5-45dd-9356-2e99aab6dc70.png)

하나의 리전에 하나의 ASG를 생성하는 방법이다.

쿠버네티스에서 ASG를 사용하는 주요 이유는 클러스터에 컴퓨팅 리소스를 추가할 수 있기 때문이다.

리전별 ASG를 사용하면 여러 AZ에 컴퓨팅 리소스를 분산할 수 있으므로 애플리케이션이 AZ별 유지 관리에 탄력적으로 대처할 수 있다.

여러 AZ에 걸쳐 있는 ASG는 AZ별로 확장할 수 없지만 리소스가 AZ에 binding된 서비스(EBS 볼륨)을 사용하지 않는 경우 문제가 되지 않을 수 있다.

따라서 EBS 볼륨 대신 EFS 또는 RDS에 컨테이너 상태를 저장할 수 있는 경우 AZ에 걸쳐 있는 ASG를 사용해야 한다.

단일 ASG를 사용하면 아키텍처, 구성 및 구성 요소 간의 상호 작용이 단순화되어 시스템을 더 쉽게 이해하고 디버깅 하기 쉬워진다.

이를 통해 쿠버네티스에서의 배포(리전당 하나)를 단순화하고 고려해야 할 부분이 적기 때문에 관리 및 문제 해결에 용이하다.

여러 AZ에 걸쳐 있는 단일 ASG를 사용하면서 EBS 볼륨을 사용해야 하는 경우 VolumeBindingMode를 WaitForFirstConsumer로 변경할 수 있다.

WaitForFirstConsumer로 변경하면 PersistentVolumeClaim을 사용하는 pod가 생성될 때까지 PersistentVolume의 바인딩 및 프로비저닝이 지연된다.

### Individual instances without Auto Scaling groups

![asg3](https://user-images.githubusercontent.com/59433441/201475625-4ea982d7-c26a-4813-a2ea-0923ac25bbe5.png)

Auto Scaling group 없이 인스턴스들을 관리하는 방법이다.

ASG를 사용하지 않으면 AWS가 제공하는 cluster autoscaler를 사용할 수 없다.

ASG 대신 cluster-api와 같이 다른 provider의 서비스를 이용할 수 있지만, 이 경우 `CloudWatch scaling`과 같은 AWS의 일부 기능을 이용할 수 없다.

인스턴스를 확장하고 추적하는 프로비저닝 서비스가 없으면 ASG 외부에서(ASG 없이) 클러스터를 실행하는 것은 권장되지 않는다.

---

참고

- [https://aws.amazon.com/ko/blogs/containers/amazon-eks-cluster-multi-zone-auto-scaling-groups/](https://aws.amazon.com/ko/blogs/containers/amazon-eks-cluster-multi-zone-auto-scaling-groups/)
