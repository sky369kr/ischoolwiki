// Shown on /about and in the footer. Business address is left out on purpose.
export const OPERATOR = {
  name: "세상의 모든 향기",
  representative: "송기용",
  registrationNumber: "415-08-85885",
  brand: "36.9°",
  brandUrl: "https://369degree.net",
} as const;

export const CLIENT_NOTICE = {
  en: `This school is a client of the site's operator, ${OPERATOR.name} (${OPERATOR.brand}), which provides it with paid AI-visibility services. Facts on this page still come only from the school's published sources listed below.`,
  ko: `이 학교는 사이트 운영사인 ${OPERATOR.name}(${OPERATOR.brand})의 유료 AI 가시성 서비스 고객입니다. 이 페이지의 사실 정보는 아래에 적힌 학교 공개 자료에서만 가져왔습니다.`,
} as const;
