//�����Ĵ�С
var canvasSize = {"maxX": 1024, "maxY": 768};

//������ÿ��Ԫ�ر�ʾһ���������[x,y,z]������һ����9����
var vertex_pos = [
    [0, 0, 0],
    [700, 0, 0],
    [1000, 0, 0],
    [100, 400, 0],
    [600, 450, 0],
    [1000, 400, 0],
    [50, 650, 0],
    [700, 700, 0],
    [1000, 700, 0]
];

//������ɫ���飬���������涥��������ÿ��������ɫ��Ϣ[r,g,b]
var vertex_color = [
    [0, 0, 255],
    [0, 255, 0],
    [0, 255, 255],
    [255, 255, 0],
    [0, 255, 255],
    [0, 255, 0],
    [0, 255, 0],
    [0, 200, 100],
    [255, 255, 0]
];

//�ı������飬������ÿ��Ԫ�ر�ʾһ���ı��Σ����е��ĸ��������ı����ĸ������index������vertex[polygon[2][1]]��ʾ����������εĵ�2�����������
const quadrilateral = [
    [0, 1, 4, 3],
    [1, 2, 5, 4],
    [3, 4, 7, 6],
    [4, 5, 8, 7]
];

var polygon = quadrilateral;

const RADIUSQUAD = 100;                 // radius of handle is 10
const OUTLINEOFFSET = 21;               // outline of handle
const HANDLEFIELDHALFEDGE = 15;         // half edge length of square field contaning handle
const HANDLEFILLCOLOR = [255, 0, 0];    // red handle
const HANDLEOUTLINECOLOR = [0, 0, 0];   // black handle outline