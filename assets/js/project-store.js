(function () {
  var STORAGE_KEY = "english-secretary-projects-v1";
  var CURRENT_PROJECT_KEY = "english-secretary-current-project-id";
  var GENERATOR_TYPES = {
    exam: { type: "exam", label: "Mock Exam", page: "generator-exam.html" },
    analysis: { type: "analysis", label: "Analysis", page: "generator-analysis.html" },
    workbook: { type: "workbook", label: "Workbook", page: "generator-workbook.html" },
    vocab: { type: "vocab", label: "Vocab", page: "generator-vocab.html" },
    minibook: { type: "minibook", label: "Minibook", page: "generator-minibook.html" }
  };
  var PAGE_TO_TYPE = {
    "generator-exam.html": "exam",
    "generator-analysis.html": "analysis",
    "generator-workbook.html": "workbook",
    "generator-vocab.html": "vocab",
    "generator-minibook.html": "minibook"
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function generateId() {
    return "project-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function getGeneratorMetaByType(type) {
    return GENERATOR_TYPES[type] || null;
  }

  function getGeneratorMetaByPage(page) {
    var type = PAGE_TO_TYPE[page];
    return type ? GENERATOR_TYPES[type] : null;
  }

  function getGeneratorMetas() {
    return Object.keys(GENERATOR_TYPES).map(function (key) {
      return GENERATOR_TYPES[key];
    });
  }

  function getOptionText(value, fallback) {
    if (!value) return fallback || "";
    return String(value).trim();
  }

  function buildTitle(project) {
    var parts = [
      getOptionText(project.school),
      getOptionText(project.grade),
      getOptionText(project.year),
      getOptionText(project.term),
      getOptionText(project.examKind)
    ].filter(Boolean);
    if (parts.length) {
      return parts.join(" ");
    }
    return "New Project";
  }

  function normalizeContent(content) {
    var meta = getGeneratorMetaByType(content.type);
    return {
      id: content.id || content.type || generateId(),
      type: content.type || "",
      label: content.label || (meta ? meta.label : "Content"),
      title: content.title || "",
      status: content.status || "Generated",
      page: content.page || (meta ? meta.page : ""),
      summary: content.summary || "",
      format: content.format || "",
      preset: content.preset || "",
      updatedAt: content.updatedAt || nowIso()
    };
  }

  function normalizeProject(project) {
    var normalizedContents = Array.isArray(project.contents)
      ? project.contents.map(normalizeContent)
      : [];
    return {
      id: project.id || generateId(),
      title: getOptionText(project.title) || buildTitle(project),
      school: getOptionText(project.school),
      grade: getOptionText(project.grade),
      region: getOptionText(project.region),
      district: getOptionText(project.district),
      year: getOptionText(project.year),
      term: getOptionText(project.term),
      examKind: getOptionText(project.examKind),
      scope: getOptionText(project.scope),
      summary: getOptionText(project.summary),
      note: getOptionText(project.note),
      status: getOptionText(project.status, "Draft") || "Draft",
      selectedGeneratorType: project.selectedGeneratorType || "",
      createdAt: project.createdAt || nowIso(),
      updatedAt: project.updatedAt || nowIso(),
      contents: normalizedContents
    };
  }

  function getProjectsRaw() {
    var projects = readJson(STORAGE_KEY, []);
    if (!Array.isArray(projects)) return [];
    return projects.map(normalizeProject);
  }

  function saveProjects(projects) {
    writeJson(STORAGE_KEY, projects.map(normalizeProject));
  }

  function sortProjects(projects) {
    return projects.slice().sort(function (left, right) {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }

  function getProjects() {
    return sortProjects(getProjectsRaw());
  }

  function getProject(projectId) {
    var projects = getProjectsRaw();
    for (var index = 0; index < projects.length; index += 1) {
      if (projects[index].id === projectId) {
        return projects[index];
      }
    }
    return null;
  }

  function createProject(projectData) {
    var project = normalizeProject(projectData);
    var projects = getProjectsRaw().filter(function (item) {
      return item.id !== project.id;
    });
    projects.unshift(project);
    saveProjects(projects);
    setCurrentProjectId(project.id);
    return project;
  }

  function updateProject(projectId, patch) {
    var projects = getProjectsRaw();
    var updatedProject = null;
    var nextProjects = projects.map(function (project) {
      if (project.id !== projectId) return project;
      var nextPatch = typeof patch === "function" ? patch(project) : patch;
      updatedProject = normalizeProject(Object.assign({}, project, nextPatch || {}, { id: project.id }));
      return updatedProject;
    });
    if (!updatedProject) return null;
    saveProjects(nextProjects);
    setCurrentProjectId(updatedProject.id);
    return updatedProject;
  }

  function deleteProject(projectId) {
    var projects = getProjectsRaw();
    var nextProjects = projects.filter(function (project) {
      return project.id !== projectId;
    });

    if (nextProjects.length === projects.length) {
      return false;
    }

    saveProjects(nextProjects);

    if (getCurrentProjectId() === projectId) {
      if (nextProjects.length) {
        setCurrentProjectId(nextProjects[0].id);
      } else {
        window.localStorage.removeItem(CURRENT_PROJECT_KEY);
      }
    }

    return true;
  }

  function addOrUpdateContent(projectId, content) {
    return updateProject(projectId, function (project) {
      var contents = Array.isArray(project.contents) ? project.contents.slice() : [];
      var normalizedContent = normalizeContent(content);
      var matchIndex = -1;

      for (var index = 0; index < contents.length; index += 1) {
        if (contents[index].id === normalizedContent.id || contents[index].type === normalizedContent.type) {
          matchIndex = index;
          break;
        }
      }

      if (matchIndex >= 0) {
        contents[matchIndex] = normalizeContent(Object.assign({}, contents[matchIndex], normalizedContent));
      } else {
        contents.unshift(normalizedContent);
      }

      return {
        title: content.title || project.title,
        status: "Generated",
        selectedGeneratorType: project.selectedGeneratorType || normalizedContent.type,
        updatedAt: normalizedContent.updatedAt || nowIso(),
        contents: contents
      };
    });
  }

  function setCurrentProjectId(projectId) {
    if (!projectId) return;
    window.localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  }

  function getCurrentProjectId() {
    return window.localStorage.getItem(CURRENT_PROJECT_KEY);
  }

  function getProjectIdFromLocation() {
    try {
      return new URLSearchParams(window.location.search).get("projectId");
    } catch (error) {
      return null;
    }
  }

  function syncCurrentProjectFromLocation() {
    var projectId = getProjectIdFromLocation();
    if (projectId) {
      setCurrentProjectId(projectId);
      return getProject(projectId);
    }

    var currentProjectId = getCurrentProjectId();
    return currentProjectId ? getProject(currentProjectId) : null;
  }

  function getCurrentProject() {
    return syncCurrentProjectFromLocation();
  }

  function withProjectId(targetPage, projectId) {
    var url = new URL(targetPage, window.location.href);
    if (projectId) {
      url.searchParams.set("projectId", projectId);
    }
    return url.toString();
  }

  function formatTimestamp(value) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    var hour = String(date.getHours()).padStart(2, "0");
    var minute = String(date.getMinutes()).padStart(2, "0");
    return year + "." + month + "." + day + " " + hour + ":" + minute;
  }

  function getLatestContent(project) {
    if (!project || !Array.isArray(project.contents) || !project.contents.length) {
      return null;
    }

    return project.contents.slice().sort(function (left, right) {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })[0];
  }

  function getProjectTags(project) {
    var tags = [];

    if (project && Array.isArray(project.contents)) {
      project.contents.forEach(function (content) {
        if (content.label && tags.indexOf(content.label) === -1) {
          tags.push(content.label);
        }
      });
    }

    if (!tags.length && project && project.selectedGeneratorType) {
      var meta = getGeneratorMetaByType(project.selectedGeneratorType);
      if (meta) {
        tags.push(meta.label);
      }
    }

    if (!tags.length && project && project.scope) {
      tags = project.scope
        .split(/[+,/]/)
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean)
        .slice(0, 3);
    }

    return tags.slice(0, 3);
  }

  function getProjectSummary(project) {
    if (!project) return "";
    return project.summary || project.note || project.scope || "Created project.";
  }

  window.ProjectStore = {
    createProject: createProject,
    updateProject: updateProject,
    deleteProject: deleteProject,
    addOrUpdateContent: addOrUpdateContent,
    getProjects: getProjects,
    getProject: getProject,
    getCurrentProject: getCurrentProject,
    getCurrentProjectId: getCurrentProjectId,
    setCurrentProjectId: setCurrentProjectId,
    getProjectIdFromLocation: getProjectIdFromLocation,
    syncCurrentProjectFromLocation: syncCurrentProjectFromLocation,
    withProjectId: withProjectId,
    formatTimestamp: formatTimestamp,
    getLatestContent: getLatestContent,
    getProjectTags: getProjectTags,
    getProjectSummary: getProjectSummary,
    getGeneratorMetaByType: getGeneratorMetaByType,
    getGeneratorMetaByPage: getGeneratorMetaByPage,
    getGeneratorMetas: getGeneratorMetas,
    buildTitle: buildTitle
  };
}());
