//22.10.2025-22:00

const dateToIso = (date) => {
  const [datePart, timePart] = date.split("-");
  const [day, month, year] = datePart.split(".").map((part) => parseInt(part));
  const [hours, minutes] = timePart.split(":").map((part) => parseInt(part));
  const computedDate = new Date(year, month - 1, day, hours, minutes);
  return computedDate.toISOString();
};

module.exports = dateToIso;
