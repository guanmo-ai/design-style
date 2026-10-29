"""膨胀风的核心工具：一个 SVG 滤镜把任何平面形状“吹”成充气的 3D。
原理：把形状的透明度模糊成一座“高度图”（边缘低、中间高），再用它打漫反射和高光——
越模糊越鼓（stdDeviation = 鼓起程度），视频里让这个值从 0 涨上去，就是“噗”地充气。"""


def puff_filter(fid, blur=16, height=10, shine=1.0, az=235, el=52):
    return f'''<filter id="{fid}" x="-60%" y="-60%" width="220%" height="240%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="{blur}" result="hm"/>
  <feDiffuseLighting in="hm" surfaceScale="{height}" diffuseConstant="1.05" lighting-color="#fff" result="diff"><feDistantLight azimuth="{az}" elevation="{el}"/></feDiffuseLighting>
  <feSpecularLighting in="hm" surfaceScale="{height}" specularConstant="{shine}" specularExponent="30" lighting-color="#fff" result="spec"><feDistantLight azimuth="{az}" elevation="{el + 8}"/></feSpecularLighting>
  <feGaussianBlur in="diff" stdDeviation="1.6" result="diffB"/><feComposite in="diffB" in2="SourceAlpha" operator="in" result="diffIn"/>
  <feGaussianBlur in="spec" stdDeviation="1.6" result="specB"/><feComposite in="specB" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComponentTransfer in="diffIn" result="diffSoft"><feFuncR type="linear" slope=".55" intercept=".5"/><feFuncG type="linear" slope=".55" intercept=".5"/><feFuncB type="linear" slope=".55" intercept=".5"/></feComponentTransfer>
  <feBlend in="SourceGraphic" in2="diffSoft" mode="multiply" result="shaded"/>
  <feComposite in="specIn" in2="shaded" operator="arithmetic" k1="0" k2=".85" k3="1" k4="0" result="lit"/>
  <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="sh"/>
  <feOffset in="sh" dx="10" dy="26" result="sho"/>
  <feColorMatrix in="sho" values="0 0 0 0 .35  0 0 0 0 .2  0 0 0 0 .5  0 0 0 .28 0" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="lit"/></feMerge>
</filter>'''
