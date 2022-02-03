---
title: 'ObjectMapper를 이용하여 JSON 파싱하기'
date: '2021-07-11T18:40:13.534Z'
---

프로젝트를 진행하면서 로그인 기능을 구현하기 위해 카카오 api를 사용하였다.<br/>
발급 받은 client_id와 redirect_uri를 포함하여 요청을 보냈더니 JSON 형태로 응답을 받을 수 있었다.<br/>
그다음 응답받은 JSON 객체를 POJO 형태로 deserialization 시켜 내가 사용하고자 하는 데이터를 JSON 객체로부터 가져와야했다.<br/>
나는 여기서 JSON 객체를 역직렬화 시키기 위해 사람들이 많이 사용하고 유명한 Jackson 라이브러리의 ObjectMapper 클래스를 이용하였다.<br/>
내가 ObjectMapper 클래스를 이용하여 JSON 객체를 역직렬화 시켰던 과정을 정리해보려 한다.<br/>

## ObjectMapper란?

- JSON 컨텐츠를 Java 객체로 deserialization 하거나 Java 객체를 JSON으로 serialization 할 때 사용하는 Jackson 라이브러리의 클래스이다.
- ObjectMapper는 생성 비용이 비싸기 때문에 bean/static으로 처리하는 것이 좋다.

Jackson 라이브러리에 관한 내용은 더 공부하고 나중에 따로 작성해보도록 하겠다.<br/>

## ObjectMapper 이용하기

ObjectMapper를 이용하면 JSON을 Java 객체로 변환할 수 있고, 반대로 Java 객체를 JSON 객체로 serialization 할 수 있다.<br/>
아래와 같은 Person 클래스를 이용하여 어떻게 사용하는지 간단하게 알아보자<br/>

```java
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Person {

    private String name;
    private int age;
    private String address;
}
```

### Java Object → JSON

Java 객체를 JSON으로 serialization 하기 위해서는 ObjectMapper의 `writeValue()` 메서드를 이용한다.

```java
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;

public class ObjectMapperEx {
    public static void main(String[] args) {
        ObjectMapper objectMapper = new ObjectMapper();

				// Java Object ->  JSON
        Person person = new Person("zooneon", 25, "seoul");
        try {
            objectMapper.writeValue(new File("src/person.json"), person);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

위와 같이 파라미터로 JSON을 저장할 파일과 직렬화시킬 객체를 넣어주면 된다.<br/>
여기서 주의할 점은 JSON으로 직렬화 시킬 클래스에 Getter가 존재해야 한다는 것이다.<br/>
Jackson 라이브러리는 Getter와 Setter를 이용하여 prefix를 잘라내고 맨 앞을 소문자로 만드는 것으로 필드를 식별한다.<br/>
그렇기 때문에 만약 직렬화 시킬 클래스에 Getter가 존재하지 않으면 클래스에서 필드를 식별하고 못하고 결국 값을 가져오지 못하여 에러가 발생하게 된다.<br/>
정상실행하면 다음과 같이 내가 지정한 경로에 json파일이 생성된다.<br/>

<img width="400" alt="1" src="https://user-images.githubusercontent.com/59433441/152308206-78531cd3-25be-48fc-b169-0243e2666220.png">

파일을 열어보면 Java 객체로 넣어줬던 값들이 JSON 형태로 잘 저장되어 있는 것을 볼 수 있다.<br/>

**src/person.json**

```json
{ "name": "zooneon", "age": 25, "address": "seoul" }
```

### JSON → Java Object

JSON 파일을 Java 객체로 deserialization 하기 위해서는 ObjectMapper의 `readValue()` 메서드를 이용한다.

```java
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ObjectMapperEx {
    public static void main(String[] args) {
        ObjectMapper objectMapper = new ObjectMapper();

        // JSON -> Java Object
        String json = "{\"name\":\"zooneon\",\"age\":25,\"address\":\"seoul\"}";
        try {
            Person deserializedPerson = objectMapper.readValue(json, Person.class);
            System.out.println(deserializedPerson);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
}

// 실행 결과: Person(name=zooneon, age=25, address=seoul)
```

위와 같이 파라미터로 JSON 형태의 문자열 or 객체와 역직렬화 시킬 클래스를 넣어주면 된다.<br/>
여기서 주의할 점이 있는데, 역직렬화 시킬 클래스(여기서는 Person 클래스)에 JSON을 파싱한 결과를 전달할 생성자가 있어야 한다.<br/>
나는 기본 생성자를 이용하였지만 생성자에 Jackson 라이브러리의 `@JsonCreator` 어노테이션을 쓰는 등 다양한 방법이 있다.<br/>
만약 다음과 같은 에러가 발생한다면, 클래스에 적절한 생성자가 없는 경우이다.<br/>

```java
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `Person` (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
 at [Source: (String)"{"name":"zooneon","age":25,"address":"seoul"}"; line: 1, column: 2]
	at com.fasterxml.jackson.databind.exc.InvalidDefinitionException.from(InvalidDefinitionException.java:67)
	at com.fasterxml.jackson.databind.DeserializationContext.reportBadDefinition(DeserializationContext.java:1764)
	at com.fasterxml.jackson.databind.DatabindContext.reportBadDefinition(DatabindContext.java:400)
	at com.fasterxml.jackson.databind.DeserializationContext.handleMissingInstantiator(DeserializationContext.java:1209)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeFromObjectUsingNonDefault(BeanDeserializerBase.java:1415)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserializeFromObject(BeanDeserializer.java:362)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:195)
	at com.fasterxml.jackson.databind.deser.DefaultDeserializationContext.readRootValue(DefaultDeserializationContext.java:322)
	at com.fasterxml.jackson.databind.ObjectMapper._readMapAndClose(ObjectMapper.java:4593)
	at com.fasterxml.jackson.databind.ObjectMapper.readValue(ObjectMapper.java:3548)
	at com.fasterxml.jackson.databind.ObjectMapper.readValue(ObjectMapper.java:3516)
	at ObjectMapperEx.main(ObjectMapperEx.java:22)
```

## 복잡한 JSON

그렇다면 복잡한 계층 형태의 JSON은 어떻게 파싱할까?

```json
{
  "name": "zooneon",
  "age": 25,
  "address": "seoul",
  "contact": {
    "phone_number": "0102222",
    "email": "foo@google.com"
  },
  "job": {
    "working": true,
    "workplace": {
      "name": "Sejong Univ.",
      "position": "student"
    }
  }
}
```

~~나름 만든다고 만들었는데 억지로 끼워맞춘 느낌😅~~<br/>
그렇게 복잡하지는 않지만 나름 복잡한(?) JSON을 파싱해보자<br/>

### 내가 시도했던 방법 첫 번째

받아온 JSON에서 내가 필요한 데이터가 이름, 전화번호, 직장 이름이라고 가정해보자

```java
ObjectMapper objectMapper = new ObjectMapper();

try {
		Map<String, Object> person = objectMapper.readValue(complicatedJson, new TypeReference<Map<String, Object>>() {});
		String name = person.get("name").toString();
		Map<String, String> contact = (Map<String, String>) person.get("contact");
		String phoneNumber = contact.get("phone_number");
		Map<String, Object> job = (Map<String, Object>) person.get("job");
		Map<String, String> workplace = (Map<String, String>) job.get("workplace");
		String workplaceName = workplace.get("name");

		System.out.println(name);
		System.out.println(phoneNumber);
		System.out.println(workplaceName);
} catch (JsonProcessingException e) {
		e.printStackTrace();
}

// 실행 결과: zooneon
//		    0102222
//			Sejong Univ.
```

위와 같이 내가 필요한 데이터를 가져오기 위해 하나씩 파싱하였다.<br/>
내가 보기에도 지저분해 보였고, 만약 JSON 파일이 더 복잡해진다면 훨씬 지저분해질 것이라는 생각이 들었다.<br/>
그래서 어떻게 할지 생각하던 중, 같이 프로젝트를 진행하고 있는 유신님이 dto 클래스를 만들어서 한번에 매핑하는 것이 더 좋을 것 같다고 리뷰를 해주셨다.<br/>
나도 그게 더 효율적일 것 같아서 코드를 수정하였다.<br/>

### 내가 시도했던 방법 두 번째

위와 마찬가지로 받아온 JSON에서 내가 필요한 데이터가 이름, 전화번호, 직장 이름이라 가정하고 dto 역할을 할 클래스를 만들었다.

```java
@ToString
@Getter
@NoArgsConstructor
public class PersonDto {

    private String name;
    private Contact contact;
    private Job job;
}
```

```java
@ToString
@Getter
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class Contact {

    private String phoneNumber;
    private String email;
}
```

계층 형태의 JSON을 한번에 파싱하기 위해 위와 같이 내부 데이터를 위한 클래스를 따로 만들어주었다.<br/>
이제 objectMapper를 이용하여 파싱을 진행할 텐데 그전에 설정해 주어야 하는 것이 있다.<br/>

```java
objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
```

이 설정을 통해 JSON의 모든 데이터를 파싱하는 것이 아닌 내가 필요로 하는 데이터, 즉 내가 필드로 선언한 데이터들만 파싱할 수 있다.

```java
ObjectMapper objectMapper = new ObjectMapper();
objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

try {
		PersonDto personDto = objectMapper.readValue(complicatedJson, PersonDto.class);
		System.out.println(personDto.getName());
		System.out.println(personDto.getContact().getPhoneNumber());
		System.out.println(personDto.getJob().getWorkplace().getName());
} catch (JsonProcessingException e) {
		e.printStackTrace();
}

// 실행 결과: zooneon
//		    0102222
//			Sejong Univ.
```

파싱할 클래스를 이용하니 훨씬 깔끔해진 느낌이 들었다.<br/>
하지만 여기서도 아쉬운 부분이 있었다.<br/>

<img width="400" alt="2" src="https://user-images.githubusercontent.com/59433441/152308173-32ef2781-002e-425e-9995-721183d718bb.png">

내부 데이터를 파싱하기 위해 클래스들을 따로 만들다보니 파싱할 때를 제외하고는 필요하지 않은 클래스들이 많아졌다.<br/>
이또한 JSON이 복잡해지면 불필요한 클래스들이 늘어날 것이고 유지보수하기 힘들 것이라는 생각이 들었다.<br/>

### 내가 시도했던 방법 세 번째

그러던 중 새로운 클래스를 만드는 것이 아닌 내부 클래스를 이용하여 한 번에 파싱 할 수 있다는 방법을 알게 되었다.

```java
@ToString
@Getter
@NoArgsConstructor
public class InnerClassPersonDto {

    private String name;
    private InnerContact contact;
    private InnerJob job;

    @Getter
    @NoArgsConstructor
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public class InnerContact {

        private String phoneNumber;
        private String email;
    }

    @Getter
    @NoArgsConstructor
    public class InnerJob {

        private boolean working;
        private InnerWorkplace workplace;

        @Getter
        @NoArgsConstructor
        public class InnerWorkplace {

            private String name;
            private String position;
        }
    }
}
```

내부 클래스를 이용하여 하나의 dto 클래스에 파싱할 데이터를 위한 클래스들을 만들어주었다.

```java
ObjectMapper objectMapper = new ObjectMapper();
objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

try {
		InnerClassPersonDto innerClassPersonDto = objectMapper.readValue(complicatedJson, InnerClassPersonDto.class);
		System.out.println(innerClassPersonDto.getName());
		System.out.println(innerClassPersonDto.getContact().getPhoneNumber());
		System.out.println(innerClassPersonDto.getJob().getWorkplace().getName());
} catch (JsonProcessingException e) {
		e.printStackTrace();
}

// 실행 결과: zooneon
//			0102222
//			Sejong Univ.
```

위와 같이 파싱이 잘 되는 것을 확인할 수 있다.

### 내가 시도했던 방법 네 번째

내부 클래스를 이용하여 파싱하는 방법을 사용하다가 문득 만약에 JSON에 들어있는 데이터가 많고 그 데이터들을 다 파싱해야한다면 내부 클래스들도 많아질텐데, 그러면 가독성도 떨어지고 유지보수하기도 힘들지 않을까? 라는 생각이 들었다.<br/>
그래서 해당 JSON을 파싱하기 위한 클래스들을 다시 외부 클래스로 나누고 패키지화하여 관리하는 방법이 더 나을 것 같다고 생각하였다.<br/>

<img width="400" alt="3" src="https://user-images.githubusercontent.com/59433441/152308179-96b76281-569f-4e4c-8b30-351f0f21846c.png">

파싱하는 방법은 두 번째와 동일하게 하면 된다.<br/>
내가 했던 방법들보다 더 좋은 방법도 분명 있을 것 같은데 좀 더 고민해봐야겠다.<br/>

<br/>

---
