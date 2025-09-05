<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Portfolio API

이 프로젝트는 포트폴리오 관리를 위한 REST API를 제공합니다.

### API 엔드포인트

- `GET /api/portfolio/{accountId}` - 포트폴리오 전체 데이터 조회
- `GET /api/portfolio/{accountId}/performance` - 포트폴리오 성과 조회
- `GET /api/portfolio/{accountId}/assets` - 포트폴리오 자산 조회
- `GET /api/portfolio/{accountId}/allocation` - 포트폴리오 할당 조회
- `GET /api/portfolio/{accountId}/transactions` - 최근 거래 내역 조회

### 사용 가능한 계정 ID

- `acc_001` - 김철수 포트폴리오
- `acc_002` - 이영희 포트폴리오

### 예시 요청

```bash
# 포트폴리오 전체 데이터 조회
curl http://localhost:3000/api/portfolio/acc_001

# 특정 기간 성과 조회
curl http://localhost:3000/api/portfolio/acc_001/performance?period=1M

# 거래 내역 조회 (최대 5건)
curl http://localhost:3000/api/portfolio/acc_001/transactions?limit=5
```

## CRM API

투자증권 CRM 시스템을 위한 REST API를 제공합니다.

### API 엔드포인트

#### 고객 관리

- `POST /crm/customers` - 고객 생성
- `GET /crm/customers` - 고객 목록 조회 (검색/필터링 지원)
- `GET /crm/customers/:id` - 고객 상세 조회
- `PUT /crm/customers/:id` - 고객 정보 수정
- `DELETE /crm/customers/:id` - 고객 삭제

#### 상담/문의 이력

- `POST /crm/customers/:customerId/contacts` - 상담 이력 생성
- `GET /crm/customers/contacts` - 상담 이력 조회 (customerId 쿼리 파라미터로 특정 고객 조회 가능)

#### 투자계좌

- `POST /crm/customers/:customerId/accounts` - 계좌 생성
- `GET /crm/customers/:customerId/accounts` - 고객별 계좌 목록 조회
- `PUT /crm/accounts/:id` - 계좌 정보 수정

#### 투자상품

- `POST /crm/products` - 상품 생성
- `GET /crm/products` - 상품 목록 조회
- `GET /crm/products/:id` - 상품 상세 조회
- `PUT /crm/products/:id` - 상품 정보 수정

#### 거래내역

- `POST /crm/transactions` - 거래 생성
- `GET /crm/transactions` - 거래내역 조회 (검색/필터링 지원)

#### 통계

- `GET /crm/statistics/customers` - 고객 통계
- `GET /crm/statistics/transactions` - 거래 통계

### 예시 요청

```bash
# 고객 생성
curl -X POST http://localhost:3000/crm/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "홍길동",
    "phoneNo": "010-1234-5678",
    "email": "hong@example.com",
    "customerGrade": "VIP",
    "joinDate": "2024-01-01"
  }'

# 고객 검색 (VIP 등급)
curl "http://localhost:3000/crm/customers?customerGrade=VIP&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 거래 생성
curl -X POST http://localhost:3000/crm/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": 1,
    "productId": 1,
    "tradeType": "BUY",
    "tradeAmount": 100,
    "tradePrice": 50000
  }'
```

### 상세 API 문서

자세한 API 문서는 [CRM_API_DOCUMENTATION.md](./CRM_API_DOCUMENTATION.md)를 참조하세요.

## Project setup

```bash
$ npm install
```

## Environment Configuration

프로젝트는 환경별로 다른 설정을 사용합니다:

### 환경변수 설정

- `NODE_ENV`: 애플리케이션 환경 설정
  - `development`: 개발 환경 (Swagger 활성화)
  - `production`: 프로덕션 환경 (Swagger 비활성화, 메모리 최적화)

### 스크립트별 환경 설정

```bash
# 개발 환경 (Swagger 활성화)
$ npm run start:dev

# 프로덕션 환경 (Swagger 비활성화)
$ npm run start:prod

# 일반 시작 (프로덕션 모드)
$ npm run start
```

**참고**: 프로덕션 환경에서는 Swagger가 자동으로 비활성화되어 메모리 사용량이 줄어듭니다.

### 배포 환경 설정

Render.com 등 클라우드 배포 환경에서는 다음 스크립트를 사용하세요:

```bash
# 배포 전 빌드 포함
$ npm run start:prod

# 빌드 후 시작 (빌드가 이미 완료된 경우)
$ npm run start:deploy
```

**중요**: 배포 환경에서는 `npm run start:prod`를 사용하여 빌드와 실행을 순차적으로 처리하세요.

### 메모리 최적화

클라우드 환경에서 메모리 부족 오류가 발생하는 경우:

```bash
# 기본 메모리 제한 (512MB)
$ npm run start:prod

# 낮은 메모리 환경용 (256MB)
$ npm run start:low-memory

# 환경변수로 메모리 제한 설정
$ NODE_OPTIONS=256 npm run start:env-memory
```

**메모리 제한 옵션**:

- `--max-old-space-size=256`: 256MB 힙 메모리
- `--max-old-space-size=512`: 512MB 힙 메모리 (기본값)
- `--max-old-space-size=1024`: 1GB 힙 메모리

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
