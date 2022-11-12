---
title: 'kaniko란'
date: '2022-10-23T23:35:38.312Z'
---

### 개요

현재 continous delivery를 위해 젠킨스 컨테이너에서 Dockerfile을 이용하여 이미지를 빌드 하는 과정이 필요했다.

젠킨스 컨테이너 안에서 도커 데몬을 실행하는 방법도 있지만, 도커 데몬의 경우 root 권한이 필요하므로 컨테이너가 호스트의 root 권한을 공유하게 되는 문제가 발생한다.

또한 나는 현재 쿠버네티스 v1.25을 사용하고 있기 때문에 container runtime으로 containerd를 사용 중이다.

따라서 호스트의 도커 데몬을 공유하는 `DooD(Docker out of Docker)` 방식을 사용할 수 없다.

(호스트의 containerd 데몬을 공유하여 `ctr`, `nerdctl`과 같은 명령으로 빌드 할 수도 있을 것 같지만 호스트의 데몬을 공유하는 데서 오는 문제를 피할 수 없다.)

컨테이너 안에서 어떻게 이미지를 빌드 할지 찾아보다가 kaniko에 대해 알게 되었다.

### kaniko ?

kaniko는 도커 데몬 없이도 컨테이너나 클러스터 내에 Dockerfile을 이용한 이미지 빌드를 가능하게 해준다.

kaniko는 `gcr.io/kaniko-project/executor` 이미지를 이용하여 빌드를 수행한다.

문서에 따르면 다른 이미지에서 바이너리 형태로 실행하는 것을 권장하지 않는다.

kaniko executor는 이미지를 빌드하고 저장소에 push 하는 역할을 한다.

Dockerfile에서 베이스 이미지를 추출하고,  명령어를 실행할 때마다 스냅샷을 이용하여 layering을 진행한다.

### kaniko build context

kaniko가 이미지 빌드에 사용할 Dockerfile을 포함하고 있는 디렉토리를 의미한다.

현재 kaniko의 build context로 사용할 수 있는 스토리지 옵션들은 다음과 같다.

- GCS Bucket
- S3 Bucket
- Azure Blob Storage
- Local Directory
- Local Tar
- Standard Input
- Git Repository

local directory는 kaniko container의 디렉토리를 의미한다.

따라서 이 옵션을 사용하기 위해서는 호스트의 디렉토리와 마운트 하거나 별도의 스토리지 공간을 마운트 하여 사용하는 것이 좋다.

GCS Bucket, S3 Bucket과 같은 오브젝트 스토리지를 이용하는 경우 bulid context를 tar 파일로 압축하여 버킷에 업로드한다.

그리고 빌드를 실행할 경우, 버킷으로부터 파일을 받아 압축을 해제한 뒤 해당 컨테스트에서 이미지 빌드를 수행한다.

`--context` 플래그를 사용하여 build context의 경로를 지정할 수 있다.

옵션 별 사용방법은 [문서](https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts)에서 확인할 수 있다.

### Running kaniko

kaniko는 다양한 환경에서 실행할 수 있지만 나는 쿠버네티스 클러스터 내에서 사용할 것이기 때문에 클러스터 내에서 사용하는 방법을 알아보았다.

마찬가지로 다른 환경에서의 실행 방법은 [문서](https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts)에 나와있다.

쿠버네티스 클러스터에서 kaniko를 실행하기 위해서는 3가지가 필요하다.

- Kubernetes cluster
- Kubernetes secret
- Bulid context

클러스터의 경우 클러스터 내에서 실행하기 때문에 당연히 필요한 것이고, secret은 빌드를 마친 후 저장소로 push 시 진행되는 인증에 필요하다.

### Caching

kaniko는 `RUN`, `COPY` 명령어로 layer를 생성한다.

해당 명령어를 실행하기 전에 먼저 캐시 데이터가 있는지 확인하고, 데이터가 존재한다면 해당 데이터를 사용한다.

존재하지 않는다면 명령을 실행한 뒤 새로운 캐시 데이터로 저장한다.

만약 cache miss가 발생하면 이후의 모든 layer들은 캐시를 사용하지 못한 채 빌드를 수행하게 된다.

`--cache` 플래그를 이용하여 캐시를 사용할지 사용하지 않을지 선택할 수 있다.

만약 원격 저장소에 캐시 레이어가 존재한다면 `--cache-repo` 플래그를 사용하면 된다.

kaniko는 로컬 디렉토리를 이용하여 이미지를 캐시 할 수 있다.

로컬 디렉토리를 이용하기 위해서는 kaniko pod를 생성할 때 디렉토리를 마운트 하면 된다.

캐시 데이터를 미리 저장하기 위해서는 `gcr.io/kaniko-project/warmer` 이미지를 사용하면 된다.

### Pushing to registry

kaniko는 docker hub 뿐만 아니라 다양한 이미지 저장소에 이미지를 푸시 할 수 있다.

docker hub에 이미지를 푸시 하기 위해선 인증 정보가 필요하다.

인증 정보가 담긴 파일(`config.json`)을 미리 생성한 뒤 pod를 생성할 때 `/kaniko/.docker/config.json`에 해당 파일을 마운트 해주면 된다.

(아무래도 당연히 kubernetes secret을 이용하는 게 좋을 것 같다.)

다른 저장소에 푸시 하는 방법은 [문서](https://github.com/GoogleContainerTools/kaniko#pushing-to-different-registries)를 통해 알 수 있다.

### Additional flags

kaniko는 다양한 플래그들을 제공하며, 플래그를 사용하여 원하는 환경을 세팅할 수 있다.

- `--build-args`
    - 빌드 타임에 사용할 arguments들을 사용할 수 있다.
    - 만약 값들이 여러 개인 경우 여러 번 사용하면 된다.
- `--cache`
    - 캐시를 사용할지 결정한다.
- `--cache-dir`
    - 캐시로 사용하는 로컬 디렉토리를 지정할 수 있다.
    - 기본값은 `/cache` 이며 `--cache=true`일 경우에만 사용된다.
- `--cahce-repo`
    - 캐시로 사용할 원격 저장소를 지정할 수 있다.
    - `--cache=true` 일 경우에만 사용된다.
- `--cleanup`
    - 빌드가 끝난 뒤에 파일시스템을 정리한다.
- `--compressed-caching`
    - `false`로 지정할 시 캐시 레이어들을 압축하지 않는다.
    - 압축을 사용하지 않으면 빌드 시간은 늘어나지만 메모리 사용을 줄일 수 있기 때문에 크기가 큰 빌드에서 사용하는 것이 좋다.
    - 빌드가 OOM(Out Of Memory) error로 실패하게 될 경우 값을 `false`로 지정하여 시도할 수 있다.
    - 기본값은 `true`이다.
- `--dockerfile`
    - 빌드에 사용할 `Dockerfile`을 지정할 수 있다.
    - 기본값은 `Dockerfile`이다.
- `--insecure`
    - tls 인증을 사용하지 않는 저장소에 이미지를 푸시 할 때 사용한다.
    - 테스트 용도로 사용하고 운영 환경에서는 사용하지 않는 것을 권장한다.
- `--label`
    - 빌드되는 이미지에 label을 지정할 수 있다.
    - Dockerfile의 `LABEL`과 같다.
- `--no-push`
    - 이미지 빌드만 수행하고 저장소에 푸시 하지 않을 경우 사용한다.
- `--push-retry`
    - 저장소 푸시에 실패했을 경우 재시도 횟수를 지정할 수 있다.
    - 기본값은 `0`이다.
- `--registry-certificate`
    - 저장소와 tls 통신에 사용할 자격증명을 지정할 수 있다.
- `--skip-tls-verify`
    - tls 인증을 사용하지 않고 저장소에 푸시 할 경우 사용한다.
    - 테스트 용도로 사용하고 운영 환경에서는 사용하지 않는 것을 권장한다.
- `--verbosity`
    - 해당 플래그를 통해 로그 레벨을 정할 수 있다.
    - 기본값은 `info`이다.
    - `--verbosity=<panic|fatal|error|warn|info|debug|trace>`

더 많은 플래그들이 존재하기 때문에 [문서](https://github.com/GoogleContainerTools/kaniko#additional-flags)를 읽어보는 것을 권장한다.

[다른 tool들과 비교](https://github.com/GoogleContainerTools/kaniko#comparison-with-other-tools)한 내용도 있으니 확인해 보면 좋을 것 같다.

<br/>

---

### 참고

- [https://github.com/GoogleContainerTools/kaniko](https://github.com/GoogleContainerTools/kaniko)