## DragList

### 拖拉排序组件

### 使用

#### container

> 选择 Element 元素作为容器

```js
DragList([Element, Element]);
```

#### isCopy

> Boolean | Function  
> 是否复制元素，复制的元素会跟随鼠标或手指移动

```js
DragList([Element, Element], { isCopy: true });
```

#### isContainer

> 自定义判断是否是容器，覆盖默认判断

```js
DragList([Element, Element], { isContainer: (ele) => {}) });
```

#### dropstart

> 当鼠标或者手指按下的时候触发

返回按下的元素 el，它的父容器 source，当前事件对象 event，下一个兄弟节点 sibling

```js
this.dragula.on("dropstart", (el, source, event, sibling) => {
  // 可以通过返回false来禁止mouseup和mousemove事件的绑定
  return false
});
```

#### droping

> 当鼠标或者手指按下后的移动时触发

返回按下的元素 el，它的父容器 source，当前事件对象 event，下一个兄弟节点 sibling

```js
this.dragula.on("drop", (currentNode, pointNode) => {
    if(...) {
        // 可以通过返回false来禁止默认的行为
        return false
    }
})
```

#### drop

> 当鼠标或者手指按松开时执行

返回按下的元素 el，移动到的父容器 target，之前的父容器 source，当前移动后的下一个兄弟节点 sibling

```js
this.dragula.on("drop", (el, target, source, sibling) => {});
```

### Demo

```jsx
import { DragList } from "components";
class DragListShow extends Component {
  componentDidMount() {
    this.handleDragula();
  }

  handleDragula = () => {
    let container = document.getElementsByClassName("container")[0];
    let wrap = document.getElementsByClassName("wrap")[0];
    let itemWrap = document.getElementsByClassName("itemWrap")[0];
    this.dragula = DragList([container, wrap, itemWrap], { isCopy: true });
    this.dragula.on("dropstart", (el, source, event, sibling) => {
      if (...) {
        return false;
      }
      console.log("el, target, event, sibling", el, source, event, sibling);
    });
    this.dragula.on("drop", (el, target, source, sibling) => {
      console.log("el, target, source, sibling", el, target, source, sibling);
    });
    this.dragula.on("droping", (currentNode, pointNode) => {
      console.log("currentNode, pointNode", currentNode, pointNode);
      if (...) {
        return false;
      }
    });
  };
}
```
