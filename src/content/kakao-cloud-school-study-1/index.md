---
title: '카카오클라우드 스쿨 스터디 1차 배포 회고'
date: '2022-08-14T20:48:20.244Z'
---

👉 [페이지 구경하기](https://kakaocloudschool.zooneon.dev/)

카카오클라우드 스쿨에서 교육을 받으면서 스터디를 진행하면 좋을 것 같다는 생각이 들었다.

서로 관심 있는 분야에 대해 연구하고 공유하면서 함께 성장할 수 있는 분위기를 만들고 싶었다.

스터디를 효율적으로 운영하기 위해 스터디 운영 페이지가 있으면 좋을 것 같다는 생각이 들어 프로젝트를 기획하게 되었다.

프로젝트를 시작하기 전 사람들에게 간단한 설문을 진행하였는데, 다행히 모두 긍정적인 반응이었다.

수요가 있다는 것을 확인한 뒤, 바로 함께 프로젝트를 진행할 팀원들을 구했다.

그동안 함께 프로젝트를 진행해오던 팀원들이 있어서 구하는데 크게 어렵지는 않았다.

그렇게 나 포함 총 3명이서 프로젝트를 시작하였다.

설문조사를 바탕으로 요구사항을 정리하고 바로 기획에 들어갔다.

최종 배포까지 기간을 일주일 잡았는데, 나는 평일에 수업을 듣고 있었고 다른 팀원들도 모두 일정이 있었기에 충분한 시간은 아니었다.

팀원 모두 중간중간 시간을 내서 개발을 진행하였고, 다행히 배포하기로 한 날짜에 맞춰 배포할 수 있었다.

배포 직후에 서버 CPU 사용량이 급격하게 뛰어 조마조마했지만 다행히 서버가 터지지는 않았다.😂

성공적으로 1차 배포를 완료한 후 회고를 진행하면 좋을 것 같아 팀원들과 회고를 진행하였다.

회고를 어떻게 진행할지 고민하던 중 인프런에서 작성한 [회고 문화](https://www.inflearn.com/pages/weekly-inflearn-41-20220215) 글을 찾을 수 있었고, 우리는 여러 회고 템플릿 중 `4L` 템플릿을 사용하여 진행하기로 결정하였다.

<br/>

팀원 개인 회고와 팀 전체 회고를 진행하였다.

<img width="800" alt="스크린샷 2022-08-14 오후 8 41 32" src="https://user-images.githubusercontent.com/59433441/184540124-888cfa9d-a77a-4590-af34-7f6d7df4d289.png">


<br/>
먼저 내가 회고한 내용은 다음과 같다.

### 개인 회고

`Liked (좋았던 점)`

- 목표한 기간에 맞춰 개발을 마칠 수 있었다.
    - 일정이 빠듯했지만 팀원 모두가 노력했기에 가능했다.
- 요구사항이 바뀔 때마다 빠르게 기능이 수정되었다.
- 각자의 의견을 활발하게 공유하였다.
    - 기획부터 배포까지 팀원들 간 커뮤니케이션이 활발히 이루어졌다.
- 실제 배포를 통해 사용자들의 의견을 들을 수 있었다.
    - 사용자들의 피드백을 즉각적으로 반영할 수 있었다.

`Lacked (아쉬웠던 점)`

- 기획 내용이 빈약하여 요구사항 변경이 잦았다.
- 도메인 단위로 개발하다 보니 개발 속도가 늦어졌다.
    - API 개발 속도가 늦어져 프론트 개발이 중간에 붕 떴다.
- 개발 기간에 맞추기 위해 너무 급하게 코드를 작성하였다.
- 개발 과정에서 코드 리뷰를 진행하지 못했다.
- 예외 처리가 너무 빈약하였다.
- 테스트 작성 방법을 통일하지 않아 중간에 어려움을 겪었다.
- Amazon Cloudfront를 이용한 CDN 서버에 대해 잘 알지 못해 배포에 어려움을 겪었다.

`Learned (배운 점)`

- 계층형 댓글 구조에 대해 이해하고 구현할 수 있었다.
- JavaMailSender를 이용한 메일 알림 기능을 구현할 수 있었다.
- 의견이 있을 때는 즉시 말하자
    - 미루고 미루다 마지막에 말한 것이 있었는데 이미 프로젝트가 막바지에 다다른 상황이어서 변경에 많은 시간이 소요되었다.
- 많은 의견을 공유할수록 애플리케이션 품질이 올라간다.
- 테스트는 많이 할수록 좋다.
    - 실제로 배포해 보면 생각보다 많은 버그를 발견할 수 있다.
    - 테스트를 더 꼼꼼히 해야 한다.

`Longed for (앞으로 바라는 점)`

- 시간이 걸리더라도 기획을 더 꼼꼼히 하자
    - 기획 내용이 구체적일수록 개발이 편해진다.
- 설계 과정에 API 설계를 포함하자
- 더 효율적인 구조를 고민하자
- 예외 처리를 꼼꼼하게 하자
- 테스트 코드를 충분히 작성하자


<br/>
다음은 팀 회고 내용이다.

### 팀 회고

`Liked (좋았던 점)`

- 실제 배포를 경험할 수 있었다.
- 제한된 시간 내에 몰입하여 배포까지 완료할 수 있었다.

`Lacked (아쉬웠던 점)`

- 초기 기획, 설계가 너무 빈약했다.
- CDN 서버에 대한 이해도 부족으로 배포에 어려움을 겪었다.
- 너무 급하게 개발한 나머지 코드가 아주 엉망이 되었다.
- 충분한 테스트를 진행하지 못했다.

`Learned (배운 점)`

- 팀원 모두 새로운 경험을 할 수 있었다.
- 생각하지도 못한 곳에서 버그가 발생한다.
- 처음 사용하는 기술은 생각하는 것처럼 잘 작동하지 않을 수 있으므로 (우리 자신을)과신하지 말자
- 커뮤니케이션을 활발히 하자

`Longed for (앞으로 바라는 점)`

- API 개발 완료 시 바로 알림이 오면 좋을 것 같다.
- 프로젝트에 애정을 주자

<br/>
사실 1차 배포를 완료한 지 좀 지난 시점이었지만, 회고를 진행하면서 팀원들 간 의견을 공유할 수 있어 좋은 시간이었다.

모든 것이 급하게 진행되었던 프로젝트였지만, 열심히 참여해 준 팀원들 덕분에 성공적으로 배포까지 마칠 수 있었다.

앞으로의 계획은 코드 리뷰를 통해 엉망인 코드들을 수정하고, 직접 개발 서버를 구축하여 개발 환경과 운영 환경을 분리할 예정이다.

또한 아직 구현하지 못한 기능들을 마무리하고, 기능적으로나 기술적으로 고도화할 수 있는 부분들은 고도화를 진행할 것이다.

앞으로도 주기적으로 회고를 진행하며 좋았던 점들은 유지하고, 아쉬웠던 점들은 개선하여 프로젝트를 발전시켜 나가야겠다.
