document.addEventListener("DOMContentLoaded", function () {
  var year = document.querySelector("[data-current-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
});
