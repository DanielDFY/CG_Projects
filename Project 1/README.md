# **Project1** 四边形网格交互式编辑

### Demo

<https://htmlpreview.github.io/?https://github.com/DanielDFY/CG_Projects/blob/master/Project%201/scanConversion.html>


### 文件说明

* `scanConversion.html` : 主页面，实现了 `drawPoint` 和 `drawLine` 方法，根据预设数据对页面进行了初始化，并实现了与鼠标的交互。
* `implement.js` : 实现了基于 `drawPoint` 和 `drawLine` 方法的绘制函数。
* `config.js` : 定义了一些配置文件。



### 开发及运行环境

* 编辑器：Visual Studio Code
* 浏览器：Chrome



### 运行方法

用支持`html5` 与 `WebGL` 的浏览器直接打开 `scanConversion.html` 即可拖动页面中的红色节点进行交互。



### 项目亮点

* 在对可拖动节点进行渲染时，只对与节点外切的正方形中的点进行计算，提高了渲染速度。
* 优化了四边形之间的覆盖问题，能确保包含被拖动节点的四边形被显示在最上层。
* 若在 `config.js` 中添加更多点坐标与几何体顶点数组，可修改 `polygon` 以显示更多的图形



### 所遇问题及解决方法

* 前期版本中顶点处的判定函数结果精确度不足，会导致有时经过顶点的扫描线无法正确地进行颜色填充。在优化判定条件后此bug被解决。



### 存在的不足

- 在非水平或竖直边线交界处，由于canvas的均匀填充机制，存在颜色混合的现象。
- 若拖动速度过快则可能会有些许卡顿。