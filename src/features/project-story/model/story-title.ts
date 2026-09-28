export const STORY_TITLE_MAX_LENGTH = 40;

export function storyTitleError(title: string) {
  if (!title.trim()) return "스토리 제목을 입력해주세요.";
  if (title.trim().length > STORY_TITLE_MAX_LENGTH) return "제목은 40자 이내로 입력해주세요.";
  return "";
}
