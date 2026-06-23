import { useEffect, useRef } from "react";
import { Dimensions, PixelRatio, View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

import { useTheme } from "@/lib/theme";
import Backdrop from "@/components/backdrop";

const { width: WIN_W, height: WIN_H } = Dimensions.get("window");

// Exact port of the web CanvasRevealEffect dot-matrix shader (GLSL ES 1.00).
const VERT = `
attribute vec2 position;
varying vec2 fragCoord;
uniform vec2 u_resolution;
void main(){
  gl_Position = vec4(position, 0.0, 1.0);
  fragCoord = (position * 0.5 + 0.5) * u_resolution;
  fragCoord.y = u_resolution.y - fragCoord.y;
}`;

const FRAG = `
precision highp float;
varying vec2 fragCoord;
uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;

float PHI = 1.61803398874989484820459;
float random(vec2 xy){ return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }

void main(){
  vec2 st = fragCoord.xy;
  st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
  st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

  float opacity = step(0.0, st.x);
  opacity *= step(0.0, st.y);

  vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

  vec3 color = u_colors[int(show_offset * 6.0)];

  float animation_speed_factor = 0.5;
  vec2 center_grid = u_resolution / 2.0 / u_total_size;
  float dist_from_center = distance(center_grid, st2);
  float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
  opacity *= step(timing_offset_intro, u_time * animation_speed_factor);
  opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

  gl_FragColor = vec4(color, opacity);
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

function compile(gl: ExpoWebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function ShaderBackdrop() {
  const { isDark } = useTheme();
  const raf = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Light theme uses the soft SVG gradient (matches the web's light dashboard).
  if (!isDark) return <Backdrop />;

  const onGL = (gl: ExpoWebGLRenderingContext) => {
    try {
      const W = gl.drawingBufferWidth;
      const H = gl.drawingBufferHeight;
      const scale = PixelRatio.get();

      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const posLoc = gl.getAttribLocation(prog, "position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.viewport(0, 0, W, H);
      gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), W, H);
      gl.uniform1fv(
        gl.getUniformLocation(prog, "u_opacities"),
        new Float32Array([0.2, 0.2, 0.2, 0.35, 0.35, 0.35, 0.55, 0.55, 0.55, 0.7])
      );
      gl.uniform3fv(
        gl.getUniformLocation(prog, "u_colors"),
        new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      );
      gl.uniform1f(gl.getUniformLocation(prog, "u_total_size"), 22 * scale);
      gl.uniform1f(gl.getUniformLocation(prog, "u_dot_size"), 2.4 * scale);
      const uTime = gl.getUniformLocation(prog, "u_time");

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      const start = Date.now();
      const render = () => {
        if (!mounted.current) return;
        const t = (Date.now() - start) / 1000;
        gl.clearColor(0.039, 0.039, 0.043, 1.0); // obsidian base
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, t);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.endFrameEXP();
        raf.current = requestAnimationFrame(render);
      };
      render();
    } catch {
      // Never let GL break the app — leave a flat obsidian frame.
      try {
        gl.clearColor(0.039, 0.039, 0.043, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.endFrameEXP();
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <GLView style={{ flex: 1 }} onContextCreate={onGL} />
      {/* Vignette: darken the edges so the field reads as depth, like the web. */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width={WIN_W} height={WIN_H}>
          <Defs>
            <RadialGradient id="vig" cx="50%" cy="34%" r="80%">
              <Stop offset="0%" stopColor="#0a0a0b" stopOpacity={0} />
              <Stop offset="58%" stopColor="#0a0a0b" stopOpacity={0.55} />
              <Stop offset="100%" stopColor="#0a0a0b" stopOpacity={0.92} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={WIN_W} height={WIN_H} fill="url(#vig)" />
        </Svg>
      </View>
    </View>
  );
}
