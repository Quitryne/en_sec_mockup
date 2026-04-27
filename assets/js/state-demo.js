document.addEventListener("DOMContentLoaded", function () {
  var simulated = document.querySelectorAll("[data-simulate]");
  simulated.forEach(function (button) {
    button.addEventListener("click", function () {
      var targetId = button.getAttribute("data-simulate");
      var target = document.getElementById(targetId);
      if (!target) return;
      target.textContent = "AI 분석 완료 · 검증 통과";
      target.classList.add("status-soft");
    });
  });
});
