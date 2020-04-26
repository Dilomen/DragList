/**
 * 判断是否是移动端
 */
export function isMobile() {
  var mobileArry = [
    "iPhone",
    "iPad",
    "Android",
    "Windows Phone",
    "BB10; Touch",
    "BB10; Touch",
    "PlayBook",
    "Nokia",
  ];
  var ua = navigator.userAgent;
  var res = mobileArry.filter(function(arr) {
    return ua.indexOf(arr) > 0;
  });
  return res.length > 0;
}

/**
 * 获取鼠标位置
 * @param {Object} e 事件对象
 * @param {String} eventName 事件名称
 */
export function getSite(e, eventName) {
  let _x;
  let _y;
  if (eventName === "touchend") {
    _x = e.changedTouches[0].clientX;
    _y = e.changedTouches[0].clientY;
    return { clientX: _x, clientY: _y };
  }
  if (isMobile()) {
    _x = e.touches[0].clientX;
    _y = e.touches[0].clientY;
  } else {
    _x = e.clientX;
    _y = e.clientY;
  }
  return { clientX: _x, clientY: _y };
}

/**
 * 获取div到可视窗口最左边的距离，除去margin
 * @param {*} element
 */
export function getElementSite(ele) {
  let _oDivObj = ele.getBoundingClientRect();
  let marginLeft = parseFloat(ele.style.marginLeft || 0);
  let marginTop = parseFloat(ele.style.marginTop || 0);
  let x = _oDivObj.x
  let y = _oDivObj.y
  let newObj = { width: _oDivObj.width, height: _oDivObj.width, x, y };
  return newObj;
}

/**
 * 根据环境选择事件
 */
export function chooseEvent() {
  const mouse = {
    mousedown: "mousedown",
    mousemove: "mousemove",
    mouseup: "mouseup",
  };
  const touch = {
    mousedown: "touchstart",
    mousemove: "touchmove",
    mouseup: "touchend",
  };
  return isMobile() ? touch : mouse;
}

export function bindEvent(ele, event, fn) {
  if (ele.addEventListener) {
    return ele.addEventListener(event, fn, false);
  }
  ele.attachEvent("on" + event, fn);
}

export function removeEvent(ele, event, fn) {
  if (ele.removeEventListener) {
    return ele.removeEventListener(event, fn, false);
  }
  ele.removeEvent("on" + event, fn);
}

/**
 * 防止mousemove时选中文本
 */
export function prohibitSelectText() {
  window.getSelection
    ? window.getSelection().removeAllRanges()
    : document.selection.empty();
}
