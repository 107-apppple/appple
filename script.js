const page = document.querySelector("#editablePage");
const storageKey = "guo-xiaotong-weekly-report-html-v2";
const initialHtml = page.innerHTML;
const imageInput = document.createElement("input");
let activeImageFrame = null;

imageInput.type = "file";
imageInput.accept = "image/*";
imageInput.hidden = true;
document.body.appendChild(imageInput);

function setStatus(text) {
  console.info(text);
}

function savePage() {
  try {
    localStorage.setItem(storageKey, page.innerHTML);
    setStatus(`已保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    setStatus("图片较大，请点导出保存");
  }
}

function loadSavedPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") {
    localStorage.removeItem(storageKey);
    setStatus("已清除本地编辑缓存");
    return;
  }

  const saved = localStorage.getItem(storageKey);
  if (saved) {
    page.innerHTML = saved;
    ensureImageControls();
    setStatus("已载入上次修改");
  }
}

function exportHtml() {
  savePage();
  const html = document.documentElement.cloneNode(true);
  html.querySelector('input[type="file"]')?.remove();
  const source = `<!doctype html>${html.outerHTML}`;
  const blob = new Blob([source], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "郭晓彤实习周报.html";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("已导出 HTML");
}

function resetPage() {
  const ok = window.confirm("确定恢复为初始内容吗？当前浏览器里的修改会被清除。");
  if (!ok) return;
  page.innerHTML = initialHtml;
  ensureImageControls();
  localStorage.removeItem(storageKey);
  setStatus("已恢复初始内容");
}

function ensureImageControls() {
  page.querySelectorAll(".phone, .image-frame").forEach((frame) => {
    if (frame.querySelector(":scope > .image-actions")) return;

    const actions = document.createElement("div");
    actions.className = "image-actions";
    actions.innerHTML = `
      <button type="button" class="image-action" data-image-action="replace">换图</button>
      <button type="button" class="image-action restore" data-image-action="restore">还原</button>
    `;
    frame.appendChild(actions);
  });
}

function replaceFrameImage(frame, src) {
  const existingImage = frame.matches(".image-frame") ? frame.querySelector(":scope > img") : null;
  if (existingImage) {
    existingImage.src = src;
    frame.classList.add("has-custom-image");
    savePage();
    return;
  }

  let image = frame.querySelector(":scope > .custom-image");
  if (!image) {
    image = document.createElement("img");
    image.className = "custom-image";
    image.alt = "自定义上传图片";
    frame.appendChild(image);
  }
  image.src = src;
  frame.classList.add("has-custom-image");
  savePage();
}

function restoreFrameImage(frame) {
  const existingImage = frame.matches(".image-frame") ? frame.querySelector(":scope > img") : null;
  if (existingImage && frame.dataset.originalSrc) {
    existingImage.src = frame.dataset.originalSrc;
    frame.classList.remove("has-custom-image");
    savePage();
    return;
  }

  frame.querySelector(":scope > .custom-image")?.remove();
  frame.classList.remove("has-custom-image");
  savePage();
}

let saveTimer;
function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(savePage, 500);
}

ensureImageControls();
loadSavedPage();

page.addEventListener("input", scheduleSave);
page.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-image-action]");
  if (!actionButton) return;

  event.preventDefault();
  event.stopPropagation();

  const frame = actionButton.closest(".phone, .image-frame");
  if (!frame) return;

  if (actionButton.dataset.imageAction === "restore") {
    restoreFrameImage(frame);
    setStatus("已还原图片");
    return;
  }

  activeImageFrame = frame;
  imageInput.value = "";
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file || !activeImageFrame) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    replaceFrameImage(activeImageFrame, reader.result);
    setStatus("图片已替换");
    activeImageFrame = null;
  });
  reader.readAsDataURL(file);
});
document.addEventListener("keydown", (event) => {
  const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
  const isExport = (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "e";
  if (isSave) {
    event.preventDefault();
    savePage();
  }
  if (isExport) {
    event.preventDefault();
    exportHtml();
  }
});
