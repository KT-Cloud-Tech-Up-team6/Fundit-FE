const CATEGORY_RETURN_PATH_KEY = "buyer-category-return-path";

export function setCategoryReturnPath(path: string) {
  try {
    sessionStorage.setItem(CATEGORY_RETURN_PATH_KEY, path);
  } catch {
    // sessionStorage 접근 불가(프라이빗 모드 등)여도 홈 폴백으로 정상 동작한다.
  }
}

export function getCategoryReturnPath() {
  try {
    return sessionStorage.getItem(CATEGORY_RETURN_PATH_KEY);
  } catch {
    return null;
  }
}

export function clearCategoryReturnPath() {
  try {
    sessionStorage.removeItem(CATEGORY_RETURN_PATH_KEY);
  } catch {
    // 접근 불가 환경에서는 애초에 값도 없으므로 무시한다.
  }
}
