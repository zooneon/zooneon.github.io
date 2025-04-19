---
title: 'AWS CodeDeploy를 이용한 자동 배포 시 환경변수 주입하기 + Spring Boot'
date: '2022-04-11T22:03:10.324Z'
tags: ['aws']
---

> 해당 글은 AWS CodeDeploy 구축 과정을 설명하지 않습니다.

학교 캡스톤 프로젝트를 시작하게 되면서 서버를 띄우고 자동 배포 파이프라인 구축을 위해 Github Actions + AWS CodeDeploy를 사용하고 있었다.

둘 다 무료이고 리소스 사용량도 많지 않아 사정상 프리티어로(t2.micro) 개발 서버를 구축해야 하는 나에게는 좋은 선택지였다.

문제는 CodeDeploy를 통한 배포 과정에서 발생하였다.

분명 배포된 shell script를 실행하면 어플리케이션이 잘 동작하였는데 자동 배포 과정에서는 어플리케이션이 실행되지 않았다.

대체 뭐가 문제인지 모르겠어서 로그 파일을 만들고 확인해보니 application.yml 파일에 등록해 놓은 환경변수를 주입받지 못하고 있었다.

```bash
# deploy.log
java.lang.RuntimeException: Driver com.mysql.cj.jdbc.Driver claims to not accept jdbcUrl, ${DATABASE_URL}
	at com.zaxxer.hikari.util.DriverDataSource.<init>(DriverDataSource.java:110) ~[HikariCP-4.0.3.jar!/:na]
	at com.zaxxer.hikari.pool.PoolBase.initializeDataSource(PoolBase.java:331) ~[HikariCP-4.0.3.jar!/:na]
	at com.zaxxer.hikari.pool.PoolBase.<init>(PoolBase.java:114) ~[HikariCP-4.0.3.jar!/:na]
	at com.zaxxer.hikari.pool.HikariPool.<init>(HikariPool.java:108) ~[HikariCP-4.0.3.jar!/:na]
	at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:112) ~[HikariCP-4.0.3.jar!/:na]
	...
```

개발 서버에서 사용할 데이터베이스 url과 username, password를 모두 공개해 놓으면 악의를 가진 사용자가 이를 활용해 데이터베이스를 마음대로 조작할 수 있기 때문에 환경변수로 처리하였다.

~~물론 그렇게 관심 가질만한 프로젝트는 아니지만 혹시나 해서~~

```yaml
# application.yml
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
```

이렇게 해두고 개발 서버에 환경변수를 등록해 놓았는데 CodeDeploy는 배포 과정에서 이 변수들을 주입받지 못하였다.

그래서 내가 직접 배포 스크립트를 실행하면 잘 동작하였지만 배포 과정에서는 동작하지 못하는 것이었다.

docker를 이용할 때는 compose파일에 변수를 넣어서 컨테이너를 띄울 때 주입받도록 하였는데(물론 이도 좋은 방법은 아닐 것이다.) 지금은 배포 과정에서 주입해줘야 했다.

그래서 그냥 배포 후 실행할 스크립트를 서버에 저장해두고(이렇게 하면 변수들을 public한 곳에서 숨긴 채로 배포할 수 있으니까?) CodeDeploy의 hook이 실행될 때 그 파일을 실행하도록 하였는데 정상적으로 작동하지 않았다.

이유를 찾아보니 CodeDeploy는 hook을 실행할 때 `배포 ID`를 이름으로 하는 디렉토리 내부의 `deployment-archive` 디렉토리를 location으로 하여 해당 디렉토리 내에서 파일을 찾는 것 같았다.

예를 들어 이런식으로

```bash
/opt/codedeploy-agent/deployment-root/9820b37d-a865-482e-b3d2-9f54ef466ab3/d-3D2Z6JP2G/deployment-archive
```

그리고 location 속성은 절대경로도 먹히지 않는 것 같았다.

따라서 이렇게 `appspec.yml` 파일을 작성하였다면 `ScriptMissing` 에러가 발생하게 된다.

```bash
# appspec.yml
version: 0.0
os: linux
files:
  - source: /
    destination: /home/ubuntu/app

hooks:
  ApplicationStart:
    - location: /home/ubuntu/deploy.sh
      timeout: 60
```

```bash
# ScriptMissing Error
Script does not exist at specified location: /opt/codedeploy-agent/deployment-root/9820b37d-a865-482e-b3d2-9f54ef466ab3/d-3D2Z6JP2G/deployment-archive/home/ubuntu/deploy.sh
```

따라서 어쩔 수 없이 프로젝트 디렉토리 내에 배포 스크립트를 작성하여 배포 시 같은 디렉토리에 위치하도록 하였다.(다른 방법이 있을 수도 있는데 내 한계였다..)

그리고 다시 환경변수를 어떻게 주입할지 열심히 찾아보았다.

# 방법 1

열심히 구글링을 하다가 찾은 건데 `/etc/profile.d`에 CodeDeploy용 쉘스크립트를 작성하면 CodeDeploy가 환경변수를 읽을 수 있다는 것이었다.

```bash
# /etc/profile.d/codedeploy.sh
export DATABASE_URL=
export DATABASE_USERNAME=
export DATABASE_PASSWORD=
```

하지만 deprecated 됐는지 나는 정상적으로 작동하지 않았다.(조금 예전 글이긴 했다.)

# 방법 2

다음으로 찾은 방법은 AWS의 `Parameter Store`를 이용하는 방법이다.

간단하게 Parameter Store에 대해 알아보자

## Parameter Store란

Parameter Store은 민감한 데이터를 외부에서 주입할 수 있도록 해주는 AWS 서비스인데 무료로 이용할 수 있다.

Parameter Store은 `AWS System Manager → Parameter Store`에서 생성할 수 있다.

간단한 특징으로는

- key-value로 값을 저장
- KMS(Key Management Service)를 이용한 암호화된 값 저장 가능
- IAM을 이용하면 일부 사용자만 접근 가능
- 값에 대한 변경 이력 저장

등이 있다.

## Parameter Store 등록

![parameter store2](https://user-images.githubusercontent.com/59433441/162748673-5efb91a8-6f3e-4e3a-8010-cc7f4846cd76.png)

파라미터는 이름, 타입, 값만 설정하면 쉽게 등록할 수 있다.

여기서 이름(`Name`)은 슬래시(`/`)를 사용한 계층 구조를 사용한다.

`ex) /config/zooneon_dev/DATABASE_PASSWORD`

꼭 계층 구조를 사용할 필요는 없지만 파라미터 관리 용이 등의 이유로 이 방식이 권장된다.

중요한 데이터의 경우 보안 문자열(`SecureString`)을 이용하여 암호화된 값을 저장할 수 있다.

보안 문자열 사용 시 Parameter Store에서는 요금이 청구되지 않지만 AWS Key Management Service 암호화 사용에 대한 요금이 적용된다.

파라미터를 등록하면 이름은 변경할 수 없고 값만 변경할 수 있으니 참고하자

## Parameter Store 사용

파라미터를 등록했다면 어떻게 사용할까?

프레임워크마다 다르겠지만 나는 현재 프로젝트에서 Spring Boot를 사용하고 있기 때문에 Spring Boot에서 사용하는 방법에 대해 알아보았다.(다른 프레임워크들도 찾아보면 자료가 있을 것이다.)

사용한 버전은 Spring Boot 2.6.5, Gradle 7.4이다.

### 의존성 설정

나는 Spring Cloud Dependency가 없어 따로 추가하였다.

```groovy
dependencyManagement {
    imports {
        mavenBom 'io.awspring.cloud:spring-cloud-aws-dependencies:2.3.3'
    }
}
```

다음으로 dependency에 `spring-cloud-starter-aws-parameter-store-config`을 추가해주면 된다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
	//...
    //parameter store
    implementation 'io.awspring.cloud:spring-cloud-starter-aws-parameter-store-config'
}
```

### yaml 파일 설정

스프링 부트에 의존성을 추가했다면 이제 yaml 파일을 설정해줘야 한다.

```yaml
# application.yml
spring:
  config:
    activate:
      on-profile: dev
    # aws-parameterstore: 추가
    import: 'aws-parameterstore:'
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

# 불러올 파라미터 설정
aws:
  paramstore:
    name: docswant
```

기존 yaml 파일에 `spring.config.import` 속성을 이용하여 `aws-parameterstore:`를 추가하여 자동으로 파라미터를 불러오도록 설정한다.

또한 하단에 `aws.paramstore` 속성을 이용하여 어떤 파라미터들을 불러올 지 설정할 수 있다.

### aws.paramstore 속성

**`prefix`**

- 파라미터의 prefix를 설정할 수 있다.
- prefix는 슬래시(`/`)로 시작해야 한다.
- default : /config

**`defaultContext`**

- 모든 서비스에서 공유되는 속성을 정의하는 컨텍스트 이름이다.
- default : application

**`profileSeparator`**

- 여러 환경에 배포할 수 있게 구분자를 사용할 수 있다.
- profile은 `spring.config.activate.on-profile` 속성에 설정된 값을 사용한다.
- profile이 존재하지 않으면 사용되지 않는다.
- dot(`.`), dash(`-`), forward slash(`/`), backward slash(`\`), underscore(`_`)만 사용 가능하다.
- default : underscore(`_`)

**`failFast`**

- 파라미터를 읽지 못했을 때 어떻게 할지 결정한다.
- true이면 어플리케이션을 실행하지 못하도록 한다.
- default : true

**`name`**

- 파라미터의 식별자 어플리케이션 이름이다.
- 파라미터를 어떤 어플리케이션에 적용할 건지 지정할 수 있다.
- 값을 지정하지 않으면 `spring.application.name` 속성값을 참조한다.
- 위 속성마저 존재하지 않으면 default 값을 사용한다.
- default : application

**`enabled`**

- Parameter Store를 사용할지 선택한다.
- default : true

### IAM 역할 등록

yaml 파일 설정을 완료했다면 Parameter Store에 접근할 수 있는 권한을 등록해야 한다.

기존에 생성한 EC2 IAM 역할에 `AmazonSSMReadOnlyAccess` 권한을 추가한다.

![iam2](https://user-images.githubusercontent.com/59433441/162745927-a99a0fcc-30ea-42b7-9a28-1bff669a7754.png)

IAM을 등록한 후에 다시 배포를 하면 성공적으로 어플리케이션이 실행될 것이다.

```bash
# deploy.log
.   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.5)
...
...
...
2022-04-11 09:36:45.514  INFO 819 --- [           main] o.s.s.web.DefaultSecurityFilterChain     : Will not secure any request
2022-04-11 09:36:46.536  INFO 819 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-04-11 09:36:46.564  INFO 819 --- [           main] s.capstone.docswant.DocswantApplication  : Started DocswantApplication in 12.712 seconds (JVM running for 14.137)
```

# 마무리

거의 Parameter Store 글에 가까운 것 같지만

그래도 내가 겪은 trouble shooting 과정을 겪는 사람들도 분명 있을 것이라 생각하기 때문에

이 글을 보고 솔루션을 찾는데 조금이나마 도움이 되었으면 좋겠다.

---

### 참고

- [https://godngu.github.io/aws/codedeploy-envrionment-variable](https://godngu.github.io/aws/codedeploy-envrionment-variable)
- [https://docs.awspring.io/spring-cloud-aws/docs/2.3.0/reference/html/index.html#integrating-your-spring-cloud-application-with-the-aws-parameter-store](https://docs.awspring.io/spring-cloud-aws/docs/2.3.0/reference/html/index.html#integrating-your-spring-cloud-application-with-the-aws-parameter-store)
