export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const days = date.getDate();
  const months: string[] = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const mes = months[date.getMonth()];
  const ano = date.getFullYear();
  const dateFormatada = days + " " + mes + ". " + ano;
  return dateFormatada;
}

export function formatDateWithHour(date: Date) {
  const dateFormat =
    formatDate(date.toString()) +
    ", " +
    date.getHours().toString().padStart(2, "0") +
    " : " +
    date.getMinutes().toString().padStart(2, "0");

  return dateFormat;
}
export function getLocalTimeString(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
export function formatDateDDMMYYYY(data: Date) {
  const day = String(data.getDate()).padStart(2, "0");
  const month = String(data.getMonth() + 1).padStart(2, "0");
  const year = data.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateMMYYYY(data: Date) {
  // const day = String(data.getDate()).padStart(2, "0");
  const month = String(data.getMonth() + 1).padStart(2, "0");
  const year = data.getFullYear();
  return `${month}/${year}`;
}
