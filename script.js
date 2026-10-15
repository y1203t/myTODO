// ToDoList：使用原生 JavaScript 管理任務，不需要 Node.js。
(() => {
  "use strict";

  const STORAGE_KEY = "todoListTasks";
  const form = document.querySelector("#todo-form");
  const input = document.querySelector("#todo-input");
  const error = document.querySelector("#input-error");
  const list = document.querySelector("#todo-list");
  const emptyState = document.querySelector("#empty-state");
  const emptyMessage = document.querySelector("#empty-message");
  const progressCount = document.querySelector("#progress-count");
  const progressFill = document.querySelector("#progress-fill");
  const progressTrack = document.querySelector("#progress-track");
  const progressPercent = document.querySelector("#progress-percent");
  const progressMessage = document.querySelector("#progress-message");
  const totalCount = document.querySelector("#total-count");
  const filterButtons = document.querySelectorAll(".filter-button");

  let tasks = loadTasks();
  let currentFilter = "all";

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) return [];
      const data = JSON.parse(stored);
      if (!Array.isArray(data)) return [];
      // 忽略格式不正確的舊資料，避免畫面出錯。
      return data.filter(task =>
        task && Number.isSafeInteger(task.id) && task.id > 0 &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
      ).map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed
      }));
    } catch (e) {
      console.warn("無法讀取已儲存的任務：", e);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn("無法儲存任務，請檢查瀏覽器儲存設定：", e);
    }
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function filteredTasks() {
    if (currentFilter === "active") return tasks.filter(task => !task.completed);
    if (currentFilter === "completed") return tasks.filter(task => task.completed);
    return tasks;
  }

  function render() {
    list.replaceChildren();

    for (const task of filteredTasks()) {
      const item = document.createElement("li");
      item.className = "todo-item";
      if (task.completed) item.classList.add("is-completed");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `標記「${task.text}」完成狀態`);
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        render();
      });

      const label = document.createElement("span");
      label.className = "todo-text";
      // 使用 textContent，避免將使用者輸入執行成 HTML。
      label.textContent = task.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.textContent = "×";
      remove.title = "刪除任務";
      remove.setAttribute("aria-label", `刪除「${task.text}」`);
      remove.addEventListener("click", () => {
        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        render();
      });

      item.append(checkbox, label, remove);
      list.append(item);
    }

    const visibleCount = filteredTasks().length;
    emptyState.hidden = visibleCount !== 0;
    if (tasks.length === 0) {
      emptyMessage.textContent = "目前還沒有待辦事項，新增一個吧！";
    } else if (currentFilter === "active") {
      emptyMessage.textContent = "沒有未完成的任務！";
    } else if (currentFilter === "completed") {
      emptyMessage.textContent = "目前還沒有完成的任務。";
    } else {
      emptyMessage.textContent = "目前還沒有待辦事項，新增一個吧！";
    }

    const completed = tasks.filter(task => task.completed).length;
    const percent = tasks.length === 0 ? 0 : Math.round(completed / tasks.length * 100);
    totalCount.textContent = `${tasks.length} 項任務`;
    progressCount.textContent = `${completed} / ${tasks.length} 項完成`;
    progressFill.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
    progressPercent.textContent = `${percent}%`;
    progressMessage.textContent = tasks.length > 0 && completed === tasks.length
      ? "太棒了！所有任務都完成了！"
      : "一點一點完成，繼續加油！";
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      error.hidden = false;
      input.focus();
      return;
    }
    error.hidden = true;
    const nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    tasks.push({ id: nextId, text: text.slice(0, 100), completed: false });
    saveTasks();
    input.value = "";
    setFilter("all");
    input.focus();
  });

  input.addEventListener("input", () => { error.hidden = true; });
  filterButtons.forEach(button => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  render();
})();
