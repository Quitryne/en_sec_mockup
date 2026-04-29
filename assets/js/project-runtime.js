(function () {
  function getPageName() {
    var parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "";
  }

  function getTextFromControl(control) {
    if (!control) return "";
    if (typeof control.value === "string") {
      return control.value.trim();
    }
    return "";
  }

  function getSelectedOptionText(select) {
    if (!select || !select.options || select.selectedIndex < 0) return "";
    return select.options[select.selectedIndex].text.trim();
  }

  function setSelectByText(select, text) {
    if (!select || !text) return;
    for (var index = 0; index < select.options.length; index += 1) {
      if (select.options[index].text.trim() === text) {
        select.selectedIndex = index;
        return;
      }
    }
  }

  function setSelectByTextOrAppend(select, text) {
    if (!select || !text) return;
    for (var index = 0; index < select.options.length; index += 1) {
      if (select.options[index].text.trim() === text) {
        select.selectedIndex = index;
        return;
      }
    }

    var option = document.createElement("option");
    option.textContent = text;
    option.value = text;
    option.selected = true;
    select.appendChild(option);
  }

  function createTag(text) {
    var tag = document.createElement("span");
    tag.className = "preview-tag";
    tag.textContent = text;
    return tag;
  }

  function createProjectCard(project) {
    var latestContent = window.ProjectStore.getLatestContent(project);
    var generatorMeta = latestContent
      ? window.ProjectStore.getGeneratorMetaByType(latestContent.type)
      : window.ProjectStore.getGeneratorMetaByType(project.selectedGeneratorType) || window.ProjectStore.getGeneratorMetaByPage("generator-exam.html");
    var continueTarget = window.ProjectStore.withProjectId(generatorMeta ? generatorMeta.page : "generator-exam.html", project.id);
    var previewTarget = window.ProjectStore.withProjectId("preview.html", project.id);
    var tags = window.ProjectStore.getProjectTags(project);
    var article = document.createElement("article");
    article.className = "project-card";
    article.setAttribute("data-created-project", project.id);

    var head = document.createElement("div");
    head.className = "project-card-head";

    var titleWrap = document.createElement("div");
    var title = document.createElement("div");
    title.className = "project-title";
    title.textContent = project.title;
    var meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent = [
      project.school || "School TBD",
      project.grade || "Grade TBD",
      window.ProjectStore.formatTimestamp(project.updatedAt)
    ].filter(Boolean).join(" / ");
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    var status = document.createElement("span");
    status.className = "status-soft";
    status.textContent = latestContent ? "Generated" : "Draft";

    head.appendChild(titleWrap);
    head.appendChild(status);
    article.appendChild(head);

    if (tags.length) {
      var chipRow = document.createElement("div");
      chipRow.className = "chip-row";
      tags.forEach(function (tagText) {
        chipRow.appendChild(createTag(tagText));
      });
      article.appendChild(chipRow);
    }

    var note = document.createElement("p");
    note.className = "lead-note";
    note.style.margin = "14px 0";
    note.textContent = window.ProjectStore.getProjectSummary(project);
    article.appendChild(note);

    var buttonRow = document.createElement("div");
    buttonRow.className = "btn-row";

    var continueButton = document.createElement("a");
    continueButton.className = "btn btn-primary";
    continueButton.href = continueTarget;
    continueButton.textContent = latestContent ? "계속 작업" : "생성 시작";

    var previewButton = document.createElement("a");
    previewButton.className = "btn btn-ghost";
    previewButton.href = previewTarget;
    previewButton.textContent = "미리보기";

    var deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-ghost";
    deleteButton.type = "button";
    deleteButton.setAttribute("data-delete-project", project.id);
    deleteButton.textContent = "삭제";

    buttonRow.appendChild(continueButton);
    buttonRow.appendChild(previewButton);
    buttonRow.appendChild(deleteButton);
    article.appendChild(buttonRow);
    return article;
  }

  function createTimelineItem(project) {
    var item = document.createElement("div");
    item.className = "timeline-item";
    item.setAttribute("data-created-project", project.id);

    var heading = document.createElement("h4");
    heading.textContent = project.title;
    var body = document.createElement("p");
    var tags = window.ProjectStore.getProjectTags(project);
    var summary = window.ProjectStore.getProjectSummary(project);
    var fragments = [];

    if (tags.length) {
      fragments.push(tags.join(", "));
    }
    if (summary) {
      fragments.push(summary);
    }
    body.textContent = fragments.join(" / ");

    item.appendChild(heading);
    item.appendChild(body);
    return item;
  }

  function updateMetricValue(selector, offset, increment) {
    var metric = document.querySelector(selector);
    if (!metric) return;
    var baseValue = Number(metric.getAttribute("data-base-value"));
    if (!baseValue) {
      baseValue = parseInt(metric.textContent, 10);
      if (!baseValue) return;
      metric.setAttribute("data-base-value", String(baseValue));
    }
    metric.textContent = String(baseValue + offset + increment);
  }

  function bindProjectCreatePage() {
    var firstSection = document.querySelector(".content-stack .section-card");
    if (!firstSection) return;

    var selects = firstSection.querySelectorAll(".form-select");
    var inputs = firstSection.querySelectorAll(".form-input");
    var textareas = firstSection.querySelectorAll(".form-textarea");
    var generatorLinks = document.querySelectorAll('a[href^="./generator-"]');

    function resolveTargetPage(anchor) {
      if (anchor.classList.contains("type-card")) {
        return anchor.getAttribute("href").replace("./", "");
      }
      var selectedCard = document.querySelector(".type-grid .type-card.selected[href]");
      if (selectedCard) {
        return selectedCard.getAttribute("href").replace("./", "");
      }
      return anchor.getAttribute("href").replace("./", "");
    }

    function buildProjectPayload(targetPage) {
      var generatorMeta = window.ProjectStore.getGeneratorMetaByPage(targetPage) || window.ProjectStore.getGeneratorMetaByPage("generator-exam.html");
      return {
        region: getSelectedOptionText(selects[0]),
        district: getSelectedOptionText(selects[1]),
        school: getSelectedOptionText(selects[2]),
        grade: getSelectedOptionText(selects[3]),
        year: getSelectedOptionText(selects[4]),
        term: getSelectedOptionText(selects[5]),
        examKind: getSelectedOptionText(selects[6]),
        title: getTextFromControl(inputs[0]),
        scope: getTextFromControl(inputs[1]),
        summary: getTextFromControl(textareas[0]),
        note: getTextFromControl(textareas[1]),
        selectedGeneratorType: generatorMeta.type,
        status: "Draft"
      };
    }

    generatorLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var targetPage = resolveTargetPage(link);
        var project = window.ProjectStore.createProject(buildProjectPayload(targetPage));
        window.location.href = window.ProjectStore.withProjectId(targetPage, project.id);
      });
    });
  }

  function bindGeneratorExamPage() {
    var project = window.ProjectStore.syncCurrentProjectFromLocation();
    if (!project) return;

    var sections = document.querySelectorAll(".content-stack .section-card");
    if (!sections.length) return;

    var infoSection = sections[0];
    var optionSection = sections[sections.length - 1];
    var inputs = infoSection.querySelectorAll(".form-input");
    var selects = infoSection.querySelectorAll(".form-select");
    var optionSelects = optionSection ? optionSection.querySelectorAll(".form-select") : [];
    var previewPanel = document.querySelector(".preview-panel");
    var previewLinks = document.querySelectorAll('a[href="./preview.html"]');
    var simulateButton = document.querySelector('[data-simulate="exam-status"]');

    if (inputs[0]) {
      inputs[0].value = project.title;
    }
    if (selects[0]) {
      setSelectByTextOrAppend(selects[0], project.region);
    }
    if (selects[1]) {
      setSelectByTextOrAppend(selects[1], project.district);
    }
    if (selects[2]) {
      setSelectByTextOrAppend(selects[2], project.school);
    }
    if (selects[3]) {
      setSelectByTextOrAppend(selects[3], project.grade);
    }

    if (previewPanel) {
      var previewRows = previewPanel.querySelectorAll(".preview-row");
      if (previewRows[0]) {
        var projectValue = previewRows[0].querySelector(".preview-val");
        if (projectValue) {
          projectValue.textContent = project.title;
        }
      }
      if (previewRows[1]) {
        var tagWrap = previewRows[1].querySelector(".preview-tags");
        if (tagWrap) {
          tagWrap.innerHTML = "";
          var tags = window.ProjectStore.getProjectTags(project);
          if (!tags.length && project.scope) {
            tags = project.scope.split(/[+,/]/).map(function (item) {
              return item.trim();
            }).filter(Boolean).slice(0, 3);
          }
          tags.forEach(function (tagText) {
            tagWrap.appendChild(createTag(tagText));
          });
        }
      }
      if (previewRows[2]) {
        var outputValue = previewRows[2].querySelector(".preview-val");
        if (outputValue) {
          var format = getSelectedOptionText(optionSelects[1]) || "HWP";
          var preset = getSelectedOptionText(optionSelects[2]) || "";
          outputValue.textContent = [format, preset].filter(Boolean).join(" + ");
        }
      }
    }

    function saveExamContent() {
      var latestTitle = inputs[0] ? getTextFromControl(inputs[0]) : project.title;
      var format = getSelectedOptionText(optionSelects[1]) || "HWP";
      var preset = getSelectedOptionText(optionSelects[2]) || "";
      var sourceCount = document.querySelectorAll("#sourceCardGrid .selectable-card").length;
      var updatedProject = window.ProjectStore.updateProject(project.id, {
        title: latestTitle || project.title,
        region: getSelectedOptionText(selects[0]) || project.region,
        district: getSelectedOptionText(selects[1]) || project.district,
        school: getSelectedOptionText(selects[2]) || project.school,
        grade: getSelectedOptionText(selects[3]) || project.grade,
        updatedAt: new Date().toISOString()
      });
      var targetProject = updatedProject || project;

      return window.ProjectStore.addOrUpdateContent(targetProject.id, {
        id: "exam",
        type: "exam",
        label: "Mock Exam",
        title: latestTitle || targetProject.title,
        page: "generator-exam.html",
        status: "Generated",
        summary: sourceCount ? "Applied " + sourceCount + " source items" : window.ProjectStore.getProjectSummary(targetProject),
        format: format,
        preset: preset,
        updatedAt: new Date().toISOString()
      }) || targetProject;
    }

    previewLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var nextProject = saveExamContent();
        window.location.href = window.ProjectStore.withProjectId("preview.html", nextProject.id);
      });
    });

    if (simulateButton) {
      simulateButton.addEventListener("click", function () {
        window.ProjectStore.updateProject(project.id, {
          status: "In Review",
          updatedAt: new Date().toISOString()
        });
      });
    }
  }

  function bindProjectsPage() {
    var projects = window.ProjectStore.getProjects();
    var grid = document.querySelector(".card-grid");
    if (grid && projects.length) {
      grid.querySelectorAll("[data-created-project]").forEach(function (item) {
        item.remove();
      });
      projects.slice().reverse().forEach(function (project) {
        grid.insertBefore(createProjectCard(project), grid.firstChild);
      });
    }

    if (grid) {
      grid.addEventListener("click", function (event) {
        var dynamicDeleteButton = event.target.closest("[data-delete-project]");
        if (dynamicDeleteButton) {
          var projectId = dynamicDeleteButton.getAttribute("data-delete-project");
          if (!projectId) return;
          window.ProjectStore.deleteProject(projectId);
          var dynamicCard = dynamicDeleteButton.closest(".project-card");
          if (dynamicCard) {
            dynamicCard.remove();
          }
          return;
        }

        var staticDeleteButton = event.target.closest("[data-delete-static-project]");
        if (staticDeleteButton) {
          var staticCard = staticDeleteButton.closest(".project-card");
          if (staticCard) {
            staticCard.remove();
          }
        }
      });
    }

    if (!projects.length) return;

    updateMetricValue(".metric-card:nth-child(1) .metric-value", 0, projects.length);
    updateMetricValue(".metric-card:nth-child(2) .metric-value", 0, projects.filter(function (project) {
      return project.contents.length > 0;
    }).length);

    var previewPanel = document.querySelector(".preview-panel");
    if (previewPanel) {
      var latestProject = projects[0];
      var latestContent = window.ProjectStore.getLatestContent(latestProject);
      var badge = previewPanel.querySelector(".preview-badge");
      var values = previewPanel.querySelectorAll(".preview-row .preview-val");

      if (badge) {
        badge.textContent = projects.length + " items";
      }
      if (values[0]) {
        values[0].textContent = latestProject.title;
      }
      if (values[1]) {
        values[1].textContent = latestContent
          ? latestContent.label + (latestContent.preset ? " / " + latestContent.preset : "")
          : "Waiting for generator";
      }
      if (values[2]) {
        values[2].textContent = "Saved projects: " + projects.length;
      }
    }
  }

  function bindPreviewPage() {
    var project = window.ProjectStore.syncCurrentProjectFromLocation();
    if (!project) return;

    var latestContent = window.ProjectStore.getLatestContent(project);
    var thumbCards = document.querySelectorAll(".thumb-card");
    var previewValues = document.querySelectorAll(".preview-panel .preview-row .preview-val");
    var previewTagWrap = document.querySelector(".preview-panel .preview-tags");
    var documentTitle = document.querySelector(".document-sheet h2");
    var documentDescription = document.querySelector(".document-sheet p");

    if (thumbCards[0]) {
      var thumbTitle = thumbCards[0].querySelector("p");
      if (thumbTitle) {
        thumbTitle.textContent = project.title;
      }
    }
    if (thumbCards[1]) {
      var thumbType = thumbCards[1].querySelector("p");
      if (thumbType) {
        thumbType.textContent = latestContent ? latestContent.label : "Project defaults";
      }
    }
    if (thumbCards[2]) {
      var thumbScope = thumbCards[2].querySelector("p");
      if (thumbScope) {
        thumbScope.textContent = project.scope || "Scope TBD";
      }
    }
    if (thumbCards[3]) {
      var thumbPreset = thumbCards[3].querySelector("p");
      if (thumbPreset) {
        thumbPreset.textContent = latestContent && latestContent.preset ? latestContent.preset : "Default preset";
      }
    }

    if (previewValues[0]) {
      previewValues[0].textContent = latestContent ? latestContent.status : project.status;
    }
    if (previewValues[1]) {
      previewValues[1].textContent = latestContent ? latestContent.summary : window.ProjectStore.getProjectSummary(project);
    }
    if (previewValues[2]) {
      previewValues[2].textContent = latestContent && latestContent.preset ? latestContent.preset : "No preset";
    }
    if (previewTagWrap) {
      previewTagWrap.innerHTML = "";
      window.ProjectStore.getProjectTags(project).forEach(function (tagText) {
        previewTagWrap.appendChild(createTag(tagText));
      });
    }

    if (documentTitle) {
      documentTitle.textContent = latestContent && latestContent.title ? latestContent.title : project.title;
    }
    if (documentDescription) {
      var descriptionParts = [];
      if (latestContent && latestContent.preset) {
        descriptionParts.push("Preset: " + latestContent.preset);
      }
      if (latestContent && latestContent.format) {
        descriptionParts.push("Output: " + latestContent.format);
      }
      if (project.scope) {
        descriptionParts.push("Scope: " + project.scope);
      }
      documentDescription.textContent = descriptionParts.join(" / ");
    }
  }

  function bindWorkspacePage() {
    var projects = window.ProjectStore.getProjects();
    if (!projects.length) return;

    var timeline = document.querySelector(".timeline-list");
    if (timeline) {
      timeline.querySelectorAll("[data-created-project]").forEach(function (item) {
        item.remove();
      });
      projects.slice(0, 3).reverse().forEach(function (project) {
        timeline.insertBefore(createTimelineItem(project), timeline.firstChild);
      });
    }

    updateMetricValue(".metric-card:nth-child(1) .metric-value", 0, projects.length);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.ProjectStore) return;

    var pageName = getPageName();
    if (pageName === "project-create.html") {
      bindProjectCreatePage();
      return;
    }
    if (pageName === "generator-exam.html") {
      bindGeneratorExamPage();
      return;
    }
    if (pageName === "projects.html") {
      bindProjectsPage();
      return;
    }
    if (pageName === "preview.html") {
      bindPreviewPage();
      return;
    }
    if (pageName === "workspace.html") {
      bindWorkspacePage();
    }
  });
}());
