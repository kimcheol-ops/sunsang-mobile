# 출조 관제 우주 프로 모바일 (설치형 웹앱 · PWA)

휴대폰 홈 화면에 설치해 앱처럼 쓰는 **출조 관제 우주 프로 모바일**입니다. PC 프로그램(SunsangHelper)과 같은 출조 지수 공식·음력 물때 표·게임 코드를 씁니다.

| 탭 | 내용 |
|---|---|
| 📡 관제 | 감시 지역 출조 지수(04~16시 최대 풍속·파고·비, PC와 같은 공식), 최적 시간, 시간별 표 |
| 🌊 물때 | 오늘·이번 주 물때(서해 7물때 / 남해·동해 8물때), 물살 세기, 제철·금어기 |
| 🗺️ 지도 | 해상 지도(OpenSeaMap 항로표지, GEBCO 수심, NASA 위성 수온), 지역별 지수 점, 바다를 누르면 파고·수온 |
| 🎮 게임 | 스토리 모드 「바다 마을 연대기 2045」 + 10종 게임, 레벨·도전·도감·코인(이 기기에 저장) |
| ☰ 더보기 | 감시 지역 고르기, 앱 설치, 바다 조황 수첩(조황 기록·주간 순위) 링크 |

- 키가 필요 없는 공개 자료만 씁니다(Open-Meteo, OpenStreetMap 등). 기상특보·해양조사원 고/저조 시각은 키가 필요해 PC 프로그램에서 봅니다.
- 앱 화면과 게임은 오프라인에서도 열리고, 예보는 마지막으로 받은 값을 보여 줍니다(서비스 워커 `sw.js`).

## 1. 준비(이미 해 둠)
```
powershell -ExecutionPolicy Bypass -File mobile\build-mobile.ps1
```
PC의 `SunsangHelper\wwwroot`에서 게임 파일 4개(game.js · games2.js · games3.js · story.js)를 복사하고 아이콘 3개를 만듭니다. 게임을 고치면 이 명령을 다시 실행하세요.

## 2. 인터넷에 올리기 (HTTPS 무료 호스팅 중 하나)
설치형 앱은 **HTTPS 주소**가 있어야 합니다. `mobile` 폴더를 통째로 올리면 됩니다.
- **GitHub Pages**: 저장소를 만들고 `mobile` 폴더 내용을 올림 → Settings → Pages → 주소 `https://<아이디>.github.io/<저장소>/`
- **Netlify Drop**: app.netlify.com/drop 에 `mobile` 폴더를 끌어 놓기
- **Cloudflare Pages**: 폴더 업로드

## 3. 휴대폰에 설치
- **안드로이드(크롬)**: 주소를 열면 「설치」 안내가 뜸, 또는 ⋮ 메뉴 → 「앱 설치/홈 화면에 추가」. 앱의 ☰ 더보기 → 「설치하기」도 됩니다.
- **아이폰(사파리)**: 공유 버튼 → 「홈 화면에 추가」

## 4. 스토어 앱(APK/AAB)으로 만들기 — 선택
1. **PWABuilder**(www.pwabuilder.com)에 2번의 주소를 넣고 「Package for stores」 → Android
2. 받은 패키지의 `assetlinks.json`을 사이트의 `/.well-known/assetlinks.json`에 올림(주소창 없는 앱 화면용)
3. APK는 휴대폰에 바로 설치해 시험, AAB는 Google Play Console(개발자 등록 1회 25달러)에 올림
4. iOS 앱스토어용 패키지도 PWABuilder에서 만들 수 있으나 Mac·Xcode·Apple 개발자 계정이 필요

## 5. 다음 단계(선택)
- **.NET MAUI 앱**: PC와 같은 C# 코어(SunsangHelper.Core)를 그대로 쓰는 네이티브 앱. `dotnet workload install maui-android`, Android SDK·JDK 설치가 필요합니다(현재 PC에는 없음).
- **특보·물때 시각까지 앱에서**: 공공데이터포털 키를 앱에 넣으면 노출되므로, 작은 서버(예: PC 프로그램 → 클라우드 함수)가 받아서 앱에 전달하는 방식을 권합니다.
- **위치 기반 기능**(내 위치 주변 지수 등)을 여러 사람에게 서비스하려면 위치정보법(위치기반서비스사업 신고)을 확인하세요.
