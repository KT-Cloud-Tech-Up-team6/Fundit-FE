/** 목록 응답으로 아는 페이지 수. 전체 페이지 수가 없는 응답은 전체 건수와 요청한 페이지 크기로 센다. */
export type PageCount = { totalPages: number } | { totalElements: number; pageSize: number };

/**
 * 주소 `page`(1부터)로 넘기는 이전/다음 목록에서 [이전 페이지]가 갈 페이지(1부터).
 * 주소를 고치거나 항목이 줄어 현재 페이지가 마지막 페이지보다 뒤면, 빈 페이지를 한 칸씩 거슬러 오지 않게
 * 실제로 있는 마지막 페이지로 보낸다. 0건이면 첫 페이지다. 그 밖에는 한 칸 앞이다.
 */
export function previousPage(page: number, count: PageCount) {
  const lastPage = Math.max(
    1,
    "totalPages" in count ? count.totalPages : Math.ceil(count.totalElements / count.pageSize),
  );
  return page > lastPage ? lastPage : page - 1;
}
