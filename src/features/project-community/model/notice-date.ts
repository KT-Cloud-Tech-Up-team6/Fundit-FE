const noticeDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatNoticeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : noticeDateFormatter.format(date).replaceAll("-", ".");
}
