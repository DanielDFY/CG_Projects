# **Project2** WebGL绘制可交互式多边形网格与简单动画

### Demo

[WebGL Interactive Demo](https://htmlpreview.github.io/?https://github.com/DanielDFY/CG_Projects/blob/master/Project%202/demo.html)



### 文件说明

* `demo.html` : 主页面。
* `implement.js` : 实现了基于 `drawPoint` 和 `drawLine` 方法的绘制函数。
* `config.js` : 配置文件。
* `lib` 文件夹：提供的WebGL工具函数。
* `Resouce` 文件夹：包含所需素材(纹理图片)。



### 开发及运行环境

* 编辑器：Visual Studio Code
* 浏览器：Chrome



### 运行方法

用支持`html5` 与 `WebGL` 的浏览器直接打开 `demo.html` 。拖动三角形顶点可改变图像形状（动画过程中无法拖动），按下 `B` 键显示/隐藏网格线，按下 `T` 键开始/暂停动画，按下 `E` 键复原旋转和缩放，保留被拖动顶点的相对位置变化，按下 `I` 键切换纹理。



### 项目亮点

* 动画及拖动变化渲染流畅。
* 动画进行一段时间后再暂停时，各顶点仍可进行交互，并且在复原动画后可保留坐标的相对变化。
* 添加了纹理切换功能。



### 所遇问题及解决方法

* 前期版本中由于每次调用渲染函数时都需要重新创建 `shader` ，拖动顶点时卡顿较为明显。后决定对三角形与网格线分别创建对象，在页面创建时提前实现  `shader` 的创建与 `buffer` 的绑定，这样每次渲染时只需传入参数调用 `render` 方法，解决了流畅度问题。
