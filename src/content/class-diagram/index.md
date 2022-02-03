---
title: '클래스 다이어그램'
date: '2021-05-13T13:33:23.434Z'
---

최근에 시작한 프로젝트가 설계 단계에 들어갔다.<br/>
먼저 팀원들과 서비스 주제와 도메인을 설정하고 도메인별 use case를 작성하였다.<br/>
이를 바탕으로 본격적인 설계를 시작했고, 객체 설계를 위해 클래스 다이어그램을 그리기로 했다.<br/>
클래스 다이어그램에 대해 잘 몰랐던 나는 이번 기회에 어떻게 작성하는 것인지 찾아보았고,<br/>
내가 찾아본 내용들을 정리해보려 한다.<br/>

# UML

UML(Unified Modeling Language)은 통합 모델링 언어로, 소프트웨어 개념들을 다이어그램으로 표현하기 위해 사용하는 시각적인 표기법이다.<br/>
UML은 설계 논의 및 의사소통을 위해 작성하기도 하고, 전체 시스템의 구조 및 클래스의 의존성을 파악하기 위해 사용하기도 한다.<br/>
UML 다이어그램의 종류에는 정적 다이어그램, 동적 다이어그램, 물리적 다이어그램이 있다.<br/>

- 정적 다이어그램 : 클래스, 객체, 데이터 구조와 이것들의 관계를 그림으로 표현하여 소프트웨어 요소에서 변하지 않는 논리적 구조를 보여준다.
- 동적 다이어그램 : 실행 흐름을 그리거나 상태가 어떻게 변하는지 그림으로 표현하여 소프트웨어 실행 도중에 어떻게 변하는지 보여준다.
- 물리적 다이어그램 : 소스 파일, 라이브러리, 데이터 파일 등의 물리적인 요소들과 이것들의 관계를 그림으로 표현해서 소프트웨어 요소에서 변하지 않는 물리적 구조를 보여준다.

이번 글에서는 정적 다이어그램 중 하나인 클래스 다이어그램에 대해 알아볼 것이다.<br/>

# 클래스 다이어그램

- 클래스 다이어그램은 정적 다이어그램으로, 시스템을 구성하는 클래스들 간의 관계를 표현하는 다이어그램이다.
- [draw.io](https://draw.io)에서 클래스 다이어그램을 작성할 수 있다.

<img width="800" alt="1" src="https://user-images.githubusercontent.com/59433441/152305590-243eb77e-627a-415c-95ae-514a87cc2984.png">

아주 간단한 클래스 다이어그램의 모습이다.<br/>
그림에서 볼 수 있듯이 클래스 다이어그램은 클래스 간의 의존 관계를 보여준다.<br/>
이 다이어그램으로 클래스들 사이의 관계를 어떻게 표현하는지 알아보자.<br/>

## 클래스의 표현

<img width="250" alt="2" src="https://user-images.githubusercontent.com/59433441/152305751-35e2296e-f481-4492-9979-5bd70ac7bf8d.png">

- 클래스는 3칸으로 표현할 수 있다.
- 제일 윗 부분에는 클래스의 이름을 작성하고, 중간 부분에는 클래스의 속성(클래스의 변수)을 작성한다.
- 그리고 맨 마지막 칸에는 클래스의 행위(클래스의 메서드)를 작성하면 된다.
- 각 항목 앞에 붙는 +, -와 같은 기호는 접근제어자를 나타내며 항목 뒤에는 인자의 타입과 함수의 반환형을 나타낸다.

**접근제어자**

> `+` : public<br/> > `-` : private<br/> > `# `: protected<br/>

분석 단계의 클래스에서는 접근제어자를 빼고 사용할 수도 있다.<br/>

<img width="250" alt="3" src="https://user-images.githubusercontent.com/59433441/152305661-03cbca82-f80b-4c6b-bc8c-a11b5c4615ca.png">

## 클래스 간의 관계 표현

<img width="800" alt="4" src="https://user-images.githubusercontent.com/59433441/152305830-8d0edf35-7d66-4141-9329-92616f9467ce.png">

출처 : http://www.nextree.co.kr/p6753/

### 일반화 관계(Generalization)

- 일반화 관계는 상속 관계(IS-A 관계)를 표현한다.
- 실선에 빈 화살표로 표시한다.

<img width="600" alt="5" src="https://user-images.githubusercontent.com/59433441/152306073-af01af62-9ebe-4bdf-acfd-0f6c8fbb92fd.png">

이 다이어그램을 코드로 표현하면 다음과 같다.<br/>

```java
public class Person {
	private String name;
	private int age;
	private String address;

	public void eat() {
			//...
	}
	public void sleep() {
			//...
	}
}

class Student extends Person {
	private Long studentId;
	private String major;

	public void study() {
		//...
	}
}
```

### 실체화 단계(Realization)

- 실체화 단계는 인터페이스의 스펙만 있는 메서드를 오버라이딩 하여 실제 기능으로 구현하는 것을 말한다.
- 점선과 빈 화살표로 표시한다.

<img width="600" alt="6" src="https://user-images.githubusercontent.com/59433441/152306171-59c2eb01-4f1d-4ce3-a990-ad173eacb62a.png">

인터페이스를 나타낼 때는 클래스처럼 표기하고 인터페이스 이름 위에 `<<interface>>`를 추가하면 된다.<br/>
위 다이어그램을 코드로 표현하면 다음과 같다.<br/>

```java
public interface ToDo {
	void eat();
	void sleep();
}

public class Person implements ToDo {
	//...

	public void eat() {
		System.out.println("밥 먹기");
	}

	public void sleep() {
		System.out.println("잠 자기");
	}
}
```

### 의존 관계(Dependency)

- 의존 관계는 어떤 클래스가 다른 클래스를 참조하는 것을 말한다.
- 점선과 화살표로 표현한다.

<img width="600" alt="7" src="https://user-images.githubusercontent.com/59433441/152306209-08581c36-683a-44f9-800b-712f7fdc7213.png">

참조의 형태는 메서드 내에서 대상 클래스의 객체 생성, 객체 사용, 메서드 호출, 객체 리턴, 매개변수로 해당 객체를 받는 것 등을 말한다.<br/>
의존 관계의 목적 또는 형태가 중요할 경우 위와 같이 스테레오 타입(<< >>)으로 어떠한 목적의 Dependency인지 의미를 명시할 수 있다.<br/>

```java
public class Car {
	private String carNumber;
	private String model;

	public void move() {
			//...
	}
}

public class Person {
	//...

	public void drive(Car car) {
		System.out.println("신나는 드라이브");
		car.move();
	}
}
```

해당 객체의 참조를 계속 유지하지 않고, 메서드의 호출이 끝나면 사용한 클래스와의 관계가 마무리된다.<br/>

### 연관 관계 & 직접 연관 관계(Association & Direct Association)

- 클래스 다이어그램에서 연관 관계는 다른 객체의 참조를 가지는 필드를 의미한다.
- 연관 관계와 직접 연관 관계의 차이는 방향성의 유무이다.
- 직접 연관 관계는 방향성을 갖는데, 방향성으로 참조 하는 쪽과 참조 당하는 쪽을 구분한다.
- 연관 관계는 실선으로 표현하고, 직접 연관 관계는 화살표로 표현한다.

<img width="600" alt="8" src="https://user-images.githubusercontent.com/59433441/152306292-03f6179f-e97c-4d59-857d-b1b5a49b6450.png">

학생과 과목의 관계를 연관 관계로 표현한 것이다.<br/>
실선 위에 `0..*` 은 Multiplicity를 나타내는데, 이는 대상 클래스의 가질 수 있는 인스턴스 개수 범위를 의미한다.<br/>
점으로 구분하며 앞에 값은 최소값을 의미하고 뒤에 값은 최대값을 의미한다.<br/>

**연관 관계의 숫자 표현**<br/>

> 1 : 1개<br/>
> 0..1 : 0 또는 1개<br/> > `*` : 0 ~ n개<br/>
> 1..\* : 1 ~ n개<br/>
> n..m : n ~ m개<br/>

즉, 위의 다이어그램은 학생들은 여러 과목을 수강할 수 있고, 각 과목은 수강 신청한 학생들의 목록을 갖고 있도록 표현한 것이다.<br/>

```java
public class Subject {
	//...
	private List<Student> studentList;

	public void addStudent(Student student) {
		studentList.add(student);
	}
}

public class Student {
	//...
	private List<Subject> subjectList;

	public void addSubject(Subject subject) {
		subjectList.add(subject);
	}
}

```

### 집약 관계 & 합성 관계(Aggregation & Composition)

- 집약 관계와 합성 관계는 연관 관계의 특수한 경우이다.
- 이들은 집합 관계로, 전체와 부분의 관계를 명확하게 명시하고자 할 때 사용한다.

**집약 관계(Aggregation)**<br/>

- 집약 관계는 한 객체가 다른 객체를 포함하는 관계이다.
- 부분을 나타내는 객체를 다른 객체와 공유할 수 있으며, 전체 객체의 라이프타임과 부분 객체의 라이프타임이 독립적일 때(전체 객체가 메모리에서 사라져도 부분 객체는 사라지지 않을 때) 집약 관계를 이용하여 표현한다.
- 실선과 비어 있는 마름모로 표현하며, 마름모가 가르키고 있는 객체가 전체 객체이다.

<img width="450" alt="9" src="https://user-images.githubusercontent.com/59433441/152306427-7f39e7b0-8590-49e8-804e-a3d2e0efd74d.png">

```java
public class Car {
	//...
	private Engine engine;
	private Radio radio;

	public Car(Engine engine, Radio radio) {
		this.engine = engine;
		this.radio = radio;
	}
}

class Engine {
	//...
}

class Radio {
	//...
}
```

**합성 관계(Composition)**<br/>

- 합성 관계는 부분 객체가 전체 객체에 속하는 관계에 이용한다.
- 집약 관계와 달리 부분 객체를 다른 객체와 공유할 수 없으며, 부분 객체의 라이프타임이 전체 객체의 라이프타임에 종속적일 때(전체 객체가 메모리에서 사라지면 부분 객체도 사라질 때) 합성 관계로 표현한다.
- 실선과 내부가 채워져 있는 마름모로 표현하며, 마찬가지로 마름모가 가르키고 있는 객체가 전체 객체이다.

<img width="450" alt="10" src="https://user-images.githubusercontent.com/59433441/152306429-326f7ed8-c48d-4aea-9e05-dee607840a16.png">

```java
public class Car {
	//...
	private Engine engine;
	private Radio radio;

	public Car() {
		engine = new Engine();
		radio = new Radio();
	}
}

class Engine {
	//...
}

class Radio {
	//...
}
```

집약 관계와 달리 전체 객체의 생성자 내부에서 부분 객체를 생성하여 사용한다.<br/>
이로써 전체 객체가 부분 객체의 라이프타임을 관리할 수 있다.<br/>

<br/>

---

### 참고

- https://www.nextree.co.kr/p6753
