---
title: 'Spring Boot profile 설정하기'
date: '2022-04-7T18:05:09.284Z'
---

스프링 부트에서는 properties파일(application.properties)이나 yaml파일(application.yaml)을 사용하여 프로젝트에 원하는 설정들을 적용하거나 수정할 수 있다.

외에도 여러 방법이 있지만(java 코드로 작성하는 방법, 시스템 환경변수를 이용하는 방법 등등) properties파일이나 yaml파일을 이용한 외재화된 설정에 대해 이야기해 보려 한다.

## profile 적용하기

보통 운영 환경 별로 설정들이 달라진다.

사용하는 DB가 다르다던가 로깅 범위 설정, 사용하는 프레임워크의 설정 등등 많은 부분들이 운영 환경에 따라 다르다.

이를 위해 설정 파일들을 운영 환경 별로 분리하여 작성할 수 있다.

```markdown
└── resources
        ├── application.yml
        ├── application-dev.yml
        ├── application-local.yml
        ├── application-prod.yml
        └── application-test.yml
```

간단한 예시를 만들어보았다.

```yaml
#application.yml
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon
```

테스트를 통해 설정이 잘 등록됐는지 확인해보자

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;
    
    @Test
    void propertyTest() {
        assertThat(appConfig.getNickname()).isEqualTo("zooneon");
        assertThat(appConfig.getAge()).isEqualTo(26);
        assertThat(appConfig.getGithub()).isEqualTo("https://github.com/zooneon");
    }
}
```

<img width="698" alt="property" src="https://user-images.githubusercontent.com/59433441/162164497-ee217c5f-289d-4346-852b-9903ea5df40c.png">

각각 환경별로 분리된 파일들은 application.yml 파일을 오버라이딩하여 사용한다.

따라서 공통 설정들은 application.yml에 작성한 뒤, 필요하다면 환경별로 설정들을 오버라이드 하면 된다.

원하는 프로파일을 적용하기 위해서는 application.yml 파일에서 적용할 프로파일을 등록하면 된다.

```yaml
#application.yml
spring:
  profiles:
    active: prod
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon
```

```yaml
#application-prod.yml
me:
  nickname: zzzooneon
  age: 100
```

잘 오버라이딩 됐는지 결과를 확인해보자

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void overrideTest() {
        assertThat(appConfig.getNickname()).isEqualTo("zzzooneon");
        assertThat(appConfig.getAge()).isEqualTo(100);
        assertThat(appConfig.getGithub()).isEqualTo("https://github.com/zooneon");
    }
}
```

<img width="714" alt="override" src="https://user-images.githubusercontent.com/59433441/162164517-8c8e9204-eea3-4dd8-a7c7-bcbb240a2d5b.png">

jar 파일로 빌드한 뒤 아래와 같은 명령을 통해 파일을 실행시키는 시점에 환경변수를 추가하여 변경할 수도 있다.

```bash
$ java -jar myapp.jar --spring.profiles.active=prod
```

## profile 설정하기

### 마이그레이션

스프링 부트 2.4 이후로 설정 파일을 작성하는 법이 달라졌다.

만약 스프링 부트 2.4 이전 버전을 사용하고 있다면 다음 명령을 통해 마이그레이션 할 수 있다고 한다.

```yaml
spring.config.use-legacy-processing: true

# any other properties
```

### spring.config.import

스프링 부트 2.4 이후부터는 `spring.config.import`과 `spring.config.location`을 이용하여 원하는 설정 파일을 불러올 수 있다.

application.yml 파일은 위의 내용과 같다.

```yaml
#zooneon.yml
me:
  nickname: zooneon
  age: 26
  univ: Sejong University
  major: Computer Engineering
```

```yaml
#application-prod.yml
spring:
  config:
    import: classpath:zooneon.yml
```

제대로 import 되었는지 테스트 해보자

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void importTest() {
        assertThat(appConfig.getNickname()).isEqualTo("zooneon");
        assertThat(appConfig.getAge()).isEqualTo(26);
        assertThat(appConfig.getUniv()).isEqualTo("Sejong University");
        assertThat(appConfig.getMajor()).isEqualTo("Computer Engineering");
    }
}
```

<img width="708" alt="import" src="https://user-images.githubusercontent.com/59433441/162164676-d1c5601f-fbf4-4d78-ba3e-7cf1757e5bc6.png">

import는 발견하는 대로 처리하며 import를 선언한 document 아래에 import한 document를 추가한 것처럼 다룬다.

또한 import한 프로파일에 있는 값은 import를 트리거 한 파일보다 우선시되어 오버라이드 할 수 있다.

```yaml
#application-prod.yml
spring:
  config:
    import: classpath:zooneon.yml
#이 값은 오버라이드 될 것이다.
me:
  nickname: junwon
```

여러 개의 파일을 import 할 수 있는데, 이 경우 뒤에 있는 파일이 우선권을 갖는다.

```yaml
#application-prod.yml
#test.yml이 우선권을 갖는다.
spring:
  config:
    import: classpath:zooneon.yml,classpath:test.yml
```

`optional` 키워드를 사용하여 설정 파일이 존재하지 않아도 어플리케이션이 실행될 수 있도록 할 수 있다.

```yaml
#application-prod.yml
#nonexistent.yml 파일이 존재하지 않아도 어플리케이션은 실행된다.
spring:
  config:
    import: optional:classpath:nonexistent.yml
```

### Multi-Document File

스프링 부트에서는 물리적인 파일 하나를 각각 독립적으로 추가되는 여러 개의 논리적 document로 분리할 수 있다.

document는 위에서 아래 순으로 처리되기 때문에 뒤에 있는 document는 앞에 있는 document를 오버라이드 할 수 있다.

yaml파일에서는 구분자(`---`)로 구분할 수 있다.(스프링 부트 2.4부터 properties파일도 `#---`를 이용할 수 있다.)

```yaml
#application-prod.yml
me:
  nickname: zzzooneon
  age: 100

---
me:
  nickname: junwon
  age: 200
```

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void separatorTest() {
        assertThat(appConfig.getNickname()).isEqualTo("junwon");
        assertThat(appConfig.getAge()).isEqualTo(200);
        assertThat(appConfig.getGithub()).isEqualTo("https://github.com/zooneon");
    }
}
```

그럼 프로파일별로 다른 설정값을 사용해야 할 때는 어떻게 정의할까?

그럴 때는 `spring.config.activate.on-profile` 속성을 사용하면 된다.

위에서 말했듯이 multi document에서 document는 위에서 아래로 처리되기 때문에 activate.on-profile 속성이 없으면 제일 마지막 설정값이 적용된다.

```yaml
#zooneon.yml
me:
  nickname: zooneon
  age: 26
  univ: Sejong University
  major: Computer Engineering

---
spring.config.activate.on-profile: test
me:
  nickname: zzzooneon
  age: 19
  univ: Not attending
  major: None

---
spring.config.activate.on-profile: prod
me:
  nickname: junwon
  age: 27
  univ: Graduate
  major: Computer Engineering
```

```yaml
#application.yml
spring:
  profiles:
    active: test
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon
```

설정값이 제대로 등록되었는지 확인해보자

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void multiDocumentTest() {
        assertThat(appConfig.getNickname()).isEqualTo("zzzooneon");
        assertThat(appConfig.getAge()).isEqualTo(19);
        assertThat(appConfig.getUniv()).isEqualTo("Not attending");
        assertThat(appConfig.getMajor()).isEqualTo("None");
    }
}
```

![multi document](https://user-images.githubusercontent.com/59433441/162164717-b3909f71-a1b8-4c64-b318-d5e91500274c.png)

스프링 부트 2.4 이전에는 `spring.profiles` 을 이용하여 각 프로파일에서 사용할 설정값들을 작성하였는데 이는 deprecated 되었다.

그렇기 때문에 이제 `spring.config.activate.on-profile`을 이용하자

![deprecated](https://user-images.githubusercontent.com/59433441/162164738-07b34893-a4c3-4409-bc6a-4b647462d6bd.png)

하지만 여기서 알아둘 것이 하나 있다.

스프링 부트 2.4 이전 사용자들은 아마 `spring.profiles`로 적용할 프로파일을 설정하고 `spring.profiles.include`를 사용하여 원하는 프로파일을 불러와서 사용했을 것이다.

```yaml
#application.yml
#legacy mode 사용
spring.config.use-legacy-processing: true
spring:
  profiles:
    active: prod

---
spring.profiles: prod
spring.profiles.include: database
me:
  nickname: junwon
  age: 26
```

```yaml
#application-database.yml
db:
  username: root
  password: 1234
```

스프링 부트 2.4 이후부터는 `spring.config.activate.on-profile`을 사용한 document에서 `spring.profiles.include`를 사용할 수 없다.

```yaml
#application.yml
spring:
  profiles:
    active: test2

---
spring:
  config:
    activate:
      on-profile: test2
  profiles:
    include: database, test
```

이렇게 설정하면 `InactiveConfigDataAccessException` 예외가 발생하게 된다.

<img width="954" alt="include with on profile property" src="https://user-images.githubusercontent.com/59433441/162164786-37fc1969-7cce-4c7f-b1b0-bc321fe2f05e.png">

따라서 include를 사용하기 위해서는 on-profile 속성과 다른 document에서 사용해야 한다.

```yaml
#application.yml
spring:
  profiles:
    active: test2
    include: database
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon

---
spring:
  config:
    activate:
      on-profile: test2
me:
  nickname: zzzooneon
  age: 50
```

테스트를 하다가 알게 된 사실인데 include를 하게 되면 하단 document에서 오버라이드한 속성을 무시하는 것 같다.

```yaml
#application.yml
spring:
  profiles:
    active: test2
    include: database
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon

---
spring:
  config:
    activate:
      on-profile: test2
me:
  nickname: zzzooneon
  age: 50
db:
  username: test2-user
  password: test2-user
```

```yaml
#application-database.yml
db:
  username: root
  password: 1234
```

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void includeIgnoreOverrideTest() {
        assertThat(appConfig.getNickname()).isEqualTo("zzzooneon");
        assertThat(appConfig.getAge()).isEqualTo(50);
        assertThat(appConfig.getDbUsername()).isEqualTo("root");
        assertThat(appConfig.getDbPassword()).isEqualTo("1234");
    }
}
```

application.yml 파일에서 볼 수 있듯이 test2 프로파일에서 me와 db 속성을 오버라이드 하였다.

테스트코드를 보면 me 속성은 오버라이드 한 결과로 나왔지만 include한 db 속성의 경우 오버라이드 한 값이 아닌 include 한 값이 저장된다.

테스트는 통과한다.

<img width="700" alt="include ignore override" src="https://user-images.githubusercontent.com/59433441/162164821-c86b5026-4de9-46a6-9f64-b22eafd8ab4f.png">

혹시 선언 순서 때문에 그런가 해서 active와 include의 순서를 바꿔보았는데도 결과는 같았다.

include도 import처럼 트리거 한 파일보다 우선시되는 것 같다.

### spring.profiles.group

스프링 부트 2.4부터는 `spring.profiles.group` 속성을 통해 원하는 프로파일을 grouping 할 수 있다.

예를 들어 환경별로 사용해야 하는 프로파일이 다를 경우 필요한 프로파일을 group에 추가하여 사용할 수 있다.

zooneon.yml 파일의 내용은 위와 같다.

```yaml
#application.yml
spring:
  profiles:
    active: prod
    group:
      prod: zooneon, prod-db
      test: zooneon, test-db
me:
  nickname: zooneon
  age: 26
  github: https://github.com/zooneon

---
spring:
  config:
    activate:
      on-profile: prod-db
db:
  username: prod-user
  password: qwerty!@

---
spring:
  config:
    activate:
      on-profile: test-db
db:
  username: test-user
  password: 1234
```

```java
package dev.zooneon.profiledemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AppConfigTest {

    @Autowired
    private AppConfig appConfig;

    @Test
    void groupTest() {
        assertThat(appConfig.getNickname()).isEqualTo("junwon");
        assertThat(appConfig.getAge()).isEqualTo(27);
        assertThat(appConfig.getDbUsername()).isEqualTo("prod-user");
        assertThat(appConfig.getDbPassword()).isEqualTo("qwerty!@");
    }
}
```

맨 상단에 group을 선언하여 prod에서는 zooneon, prod-db 프로파일을 사용하고 test에서는 zooneon, test-db 프로파일을 사용하도록 하였다.

테스트 결과를 보면 active를 prod로 선언하였기 때문에 zooneon, prod-db 프로파일이 사용된 것을 확인할 수 있다.

zooneon 프로파일에서는 `on-active: prod`로 오버라이드한 값이 사용되었다.

group 속성도 include와 마찬가지로 on-profile 속성을 사용한 document와 함께 사용하면 `InactiveConfigDataAccessException` 예외가 발생한다.

```yaml
spring:
  profiles:
    group:
      prod: zooneon, prod-db
      test: zooneon, test-db
  config:
    activate:
      on-profile: test2
```

<img width="953" alt="group with on-profile property" src="https://user-images.githubusercontent.com/59433441/162164848-3ceb1665-4491-4229-a62c-296e2fea26d9.png">

## 마무리

스프링 부트 2.4 이후의 프로파일 설정하는 방법을 간단하게 알아보았다.

2.4 이전 버전과 많이 달라졌다고 하는데 사실 2.4 이전 버전을 사용해 보지 않아서 차이가 확 와닿지는 않는 것 같다.

사실 지금까지 했던 프로젝트들도 모두 간단한 프로젝트이고 설정들도 복잡하지 않았기 때문에 잘 모르고 사용했던 것 같다.

찾아보니 생각보다 많은 기능이 있었고, 이를 활용하면 재사용성도 높아지고 더 깔끔하게 관리할 수 있을 것 같다는 생각이 들었다.

---

### 참고

- [https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-Config-Data-Migration-Guide#multi-document-yaml-ordering](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-Config-Data-Migration-Guide#multi-document-yaml-ordering)