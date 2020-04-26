import {
  getParentElement,
  isArray,
  nextElement,
  tryFunc,
  tryPromiseFunc,
} from "dark-utils";
import {
  chooseEvent,
  getElementSite,
  getSite,
  prohibitSelectText,
  bindEvent,
  removeEvent,
} from "./DragUtils";
import "./DragList.css";
let doc = document.documentElement;
let containers = [];
let _startX = 0;
let _startY = 0;
let currentNodeLeft = 0;
let currentNodeTop = 0;
let currentNode = null;
let copyNode = null;
let pointNode = null;
let source = null;
let isClickEvent = false;
let config = {
  isCopy: true,
  inContainer: true,
};
let observer = Observer();
let events = chooseEvent();
let isCopyNode = true;
// 注册监听事件
function Observer() {
  let listener = {};
  let listenEvents = ["drop", "dropstart", "droping"];
  function emit(name, ...args) {
    if (!has(name)) return;
    return tryPromiseFunc(listener[name], ...args);
  }

  function has(name) {
    return name in listener;
  }

  function on(name, fn) {
    if (!listenEvents.includes(name))
      throw new Error("请输入正确的监听事件,如:drop, dropstart, droping");
    listener[name] = fn;
  }
  function destory() {
    listener = {};
    config = {
      isCopy: true,
      inContainer: true,
    };
    clear();
    removeEvent(doc, events["mousedown"], docMouseDown);
  }
  return { emit, on, destory, has };
}

function Dragula(initContainers, options) {
  config = { ...config, ...options };
  isCopyNode = isCopy();
  containers = isArray(initContainers) ? initContainers : [initContainers];
  bindEvent(doc, "click", docClick);
  bindEvent(doc, events["mousedown"], docMouseDown);
  return observer;
}

// 是否需要复制元素，优先配置方法
function isCopy() {
  if (config && (config.isCopy === false || tryFunc(config.isCopy) === false)) {
    return false;
  }
  return true;
}

// 是否需要复制元素，优先配置方法
function isContainer(ele) {
  if (
    config && (config.isContainer === false ||
    tryFunc(config.isContainer, ele) === false)
  ) {
    return false;
  }
  return containers.includes(ele);
}

function findContainerChild(node) {
  if (node === document.documentElement || !(node instanceof HTMLElement))
    return false;
  let parentNode = getParentElement(node);
  if (isContainer(parentNode)) {
    return node;
  } else {
    return findContainerChild(parentNode);
  }
}

function docClick(e) {
  isClickEvent = true;
}

// document注册mousedown监听事件
function docMouseDown(e) {
  // 当元素执行click事件时，阻止onmousedown执行的内容
  isClickEvent = false;
  setTimeout(async () => {
    _startX = getSite(e).clientX;
    _startY = getSite(e).clientY;
    let node = document.elementFromPoint(_startX, _startY);
    node = findContainerChild(node);
    if (node && node instanceof HTMLElement) {
      currentNode = node;
      source = getParentElement(node);
      let sibling = nextElement(node);
      let isContinue = await observer.emit(
        "dropstart",
        currentNode,
        source,
        e,
        sibling
      );
      if (isContinue === false) return false;
      let elementSite = getElementSite(currentNode);
      currentNodeLeft = elementSite.x;
      currentNodeTop = elementSite.y;
      docMouseEvent();
    }
  }, 200);
}

function docMouseEvent(remove) {
  if (remove) {
    removeEvent(doc, events["mouseup"], drop);
    removeEvent(doc, events["mousemove"], drag);
  } else {
    if (isClickEvent) return false;
    bindEvent(doc, events["mouseup"], drop);
    bindEvent(doc, events["mousemove"], drag);
  }
}

// 拖拉元素
async function drag(e) {
  let dragX = getSite(e).clientX;
  let dragY = getSite(e).clientY;
  let result;
  if (isCopyNode) {
    if (
      !copyNode &&
      (Math.abs(dragY - _startY) > 10 || Math.abs(dragX - _startX) > 10)
    ) {
      copyNode = currentNode.cloneNode(true);
      copyNode.classList.add("dark-tranmit");
      copyNode.style.top = currentNodeTop + "px";
      copyNode.style.left = currentNodeLeft + "px";
      currentNode.classList.add("dark-mirror");
      document.body.appendChild(copyNode);
    }
    if (copyNode) {
      copyNode.style.top = currentNodeTop + (dragY - _startY) + "px";
      copyNode.style.left = currentNodeLeft + (dragX - _startX) + "px";
    }
  }
  pointNode = document.elementFromPoint(dragX, dragY);

  if (isContainer(pointNode)) {
    result = await isContinue();
    if (!result) return false;
    pointNode && pointNode.appendChild(currentNode);
  } else {
    pointNode = findContainerChild(pointNode);
    result = await isContinue();
    if (!result) return false;
    if (pointNode) {
      let parent = getParentElement(pointNode);
      let clientHeight = pointNode.clientHeight;
      let elementSite = getElementSite(pointNode);
      let offsetTop = elementSite.y;
      if (dragY < offsetTop + clientHeight / 2) {
        parent.insertBefore(currentNode, pointNode);
      } else if (
        dragY < offsetTop + clientHeight &&
        dragY > offsetTop + clientHeight / 2
      ) {
        let pointNodeNext = nextElement(pointNode);
        if (pointNodeNext) {
          parent.insertBefore(currentNode, pointNodeNext);
        } else {
          parent.appendChild(currentNode);
        }
      }
    }
  }
  prohibitSelectText();

  async function isContinue () {
    if (observer.has("droping")) {
      let target = pointNode && (isContainer(pointNode) ? pointNode : getParentElement(pointNode));
      let isContinueDefultExecute = await observer.emit(
        "droping",
        currentNode,
        pointNode,
        target,
        source
      );
      if (isContinueDefultExecute === false) return false;
    }
    return true;
  }
}

// 放下元素
async function drop(e) {
  let dropX = getSite(e).clientX;
  let dropY = getSite(e).clientY;
  let target = pointNode && (isContainer(pointNode) ? pointNode : getParentElement(pointNode));
  let sibling = nextElement(currentNode);
  if (Math.abs(dropY - _startY) > 15 || Math.abs(dropX - _startX) > 15) {
    observer.emit("drop", currentNode, source, target, sibling);
  }
  docMouseEvent(true);
  currentNode && currentNode.classList.remove("dark-mirror");
  if (isCopyNode && copyNode) {
    document.body.removeChild(copyNode);
  }
  clear();
}


function clear() {
  currentNode = null;
  copyNode = null;
  source = null;
  pointNode = null;
}

export default Dragula;
