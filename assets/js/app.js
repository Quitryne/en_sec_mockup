function toggleMenu(id) {
  var menu = document.getElementById(id);
  if (menu) {
    menu.classList.toggle("open");
  }
}

function bindSelectableCards() {
  document.querySelectorAll("[data-select-group]").forEach(function (container) {
    container.addEventListener("click", function (event) {
      var target = event.target.closest("[data-selectable]");
      if (!target) return;
      var mode = container.getAttribute("data-select-group");
      if (mode === "single") {
        container.querySelectorAll("[data-selectable]").forEach(function (item) {
          item.classList.remove("selected");
        });
      }
      target.classList.toggle("selected");
    });
  });
}

function bindToggleItems() {
  document.querySelectorAll("[data-toggle-item]").forEach(function (item) {
    if (!item.hasAttribute("tabindex")) {
      item.setAttribute("tabindex", "0");
    }
    if (!item.hasAttribute("role")) {
      item.setAttribute("role", "checkbox");
    }

    function sync() {
      item.setAttribute("aria-checked", item.classList.contains("selected") ? "true" : "false");
    }

    sync();

    item.addEventListener("click", function () {
      item.classList.toggle("selected");
      sync();
    });

    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.classList.toggle("selected");
        sync();
      }
    });
  });
}

function bindToggles() {
  document.querySelectorAll(".toggle-switch").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("on");
    });
  });
}

function bindNavAutoOpen() {
  var current = document.body.getAttribute("data-nav");
  if (!current) return;
  var link = document.querySelector('[data-nav-link="' + current + '"]');
  if (!link) return;
  link.classList.add("active");
  var expandable = link.closest(".nav-item-expandable");
  if (expandable) {
    expandable.classList.add("open");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bindSelectableCards();
  bindToggleItems();
  bindToggles();
  bindNavAutoOpen();
});
