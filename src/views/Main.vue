<template>
  <!-- eslint-disable vue/require-v-for-key -->
  <div class="container">
    <el-row :gutter="20">
      <el-col
        :span="6"
        :offset="1"
      >
        <el-tooltip
          effect="dark"
          :content="docs"
        >
          <el-input
            v-model="input"
            placeholder="请输入内容"
          ></el-input>
        </el-tooltip>
      </el-col>
      <el-col
        :span="3"
        :offset="0"
      >
        <el-tooltip
          class="item"
          effect="dark"
          content="角色朝向"
          placement="top"
        >
          <el-select
            v-model="dirChinese"
            placeholder="角色朝向"
          >
            <el-option value="右" />
            <el-option value="左" />
            <el-option value="上" />
            <el-option value="下" />
          </el-select>
        </el-tooltip>
      </el-col>
      <el-col
        :span="3"
        :offset="0"
      >
        <el-tooltip
          effect="dark"
          content="切换模式"
        >
          <el-checkbox
            v-model="svgMode"
            border
          >{{svgMode ? 'SVG': '文字'}}</el-checkbox>
        </el-tooltip>
      </el-col>
      <el-col
        :span="2"
        :offset="0"
      >
        <el-tooltip
          effect="dark"
          content="偶数偏移"
        >
          <el-checkbox
            v-model="evenOffset"
            border
          >{{evenOffset ? 0 : -1}}</el-checkbox>
        </el-tooltip>
      </el-col>
      <el-col
        :span="6"
        :offset="0"
        v-if="!svgMode"
      >
        <el-tooltip
          content="格式字符"
          placement="top"
          effect="dark"
        >
          <el-input
            class="emoji"
            v-model="characters"
            placeholder
          ></el-input>
        </el-tooltip>
      </el-col>
    </el-row>
    <el-row
      type="flex"
      justify="center"
    >
      <el-col
        :span="6"
        class="svg-container"
      >
        <svg
          :viewBox="svgViewBox.join(' ')"
          @mousewheel.prevent="handleScroll"
          xmlns="http://www.w3.org/2000/svg"
          style="width: 50vw; height: 50vw; max-height: 80vh; cursor: pointer;"
          @click="onClickClipboard"
          v-if="svgMode"
        >
          <mask
            id="stripe"
            maskContentUnits="objectBoundingBox"
          >
            <rect
              fill="white"
              x="0"
              y="0"
              width="100%"
              height="100%"
            />
            <rect
              v-for="v in maskY"
              fill="#000"
              x="0"
              :y="((v + t * 0.003) % 1) * 2 - 1"
              width="200%"
              height="0.2px"
              :transform="`rotate(45)`"
            />
          </mask>
          <template v-if="range.length">
            <template v-for="r of range">
              <rect
                :x="r.x"
                :y="r.y"
                :width="width"
                :height="height"
                fill="rgb(252, 143, 31)"
                fill-opacity="0.5"
                stroke-width="0"
                mask="url(#stripe)"
                :transform="`translate(${-width / 2} ${-height / 2})`"
              />
              <rect
                :x="r.x"
                :y="r.y"
                :width="width"
                :height="height"
                fill="rgb(252, 143, 31)"
                fill-opacity="0"
                stroke-width="0.01"
                stroke="#f62"
                :transform="`translate(${-width / 2} ${-height / 2})`"
              />
            </template>
          </template>
          <g :transform="`rotate(${angle(dir)}) translate(-0.5 -0.5)`">
            <circle
              cx=".5"
              cy=".5"
              r=".45"
              fill="none"
              stroke="#bfb7ab"
              stroke-width=".1"
            />
            <circle
              cx=".5"
              cy=".5"
              r=".45"
              fill="none"
              stroke="#f29019"
              stroke-width="0.1"
              stroke-dashoffset="66%"
              stroke-dasharray="25% 2"
            />
          </g>
        </svg>
        <div
          class="text-container"
          @click="onClickClipboard"
          style="line-height: 1.1em; white-space: pre; margin: 20px 0;"
          v-else
        >{{rangeString}}</div>
      </el-col>
    </el-row>
    <el-row
      type="flex"
      justify="center"
    >
      <el-alert
        :title="error ? 'SyntaxError' : '解析成功'"
        :type="error ? 'error' : 'success'"
        :description="errorMsg"
        :closable="false"
        :center="false"
        show-icon
      ></el-alert>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { map, clip } from "../utils";
import * as parser from "../utils/parser";
import { ElMessage } from "element-plus";
import Vector2 from "../utils/Vector2";

const directions = {
  r: Vector2.RIGHT.copy(),
  l: Vector2.LEFT.copy(),
  t: Vector2.TOP.copy(),
  b: Vector2.BOTTOM.copy(),
} as const;

function corners(pts: Vector2[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of pts) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  return {
    minX: Math.min(0, minX),
    minY: Math.min(0, minY),
    maxX: Math.max(0, maxX),
    maxY: Math.max(0, maxY),
  };
}

export default defineComponent({
  setup() {
    const query = new URLSearchParams(window.location.search);
    const defaultInput = "-3 3+1 1+3&1-1 1+3&1-2 1-3&1+2 1+3&1-2 1+3&1-1 3+1";
    let input = ref(query.get("range") ?? defaultInput);
    const dirChinese = ref("右" as "右" | "左" | "上" | "下");
    const dir = computed(
      () =>
        query.get("dir") ??
        { 右: "r", 左: "l", 上: "t", 下: "b" }[dirChinese.value]
    );
    const error = ref(false);

    const docs = "请输入内容";
    const evenOffset = ref(true);
    const errorMsg = ref("");

    const range = computed(() => {
      const ret = parser.load(input.value, {
        charDir: dir.value as keyof typeof directions,
        evenOffset: evenOffset.value ? 0 : -1,
      });
      let { points = [] } = ret;
      error.value = !ret.points;
        errorMsg.value = ret.message;
      return points.length < 2000 ? points : [new Vector2()];
    });

    const t = ref(0);
    const helper = () => {
      t.value++;
      requestAnimationFrame(helper);
    };
    helper();
    const maskY = ref(Object.keys([...Array(10)]).map((i) => +i * 0.2));
    const characters = ref(query.get("chars") ?? "⬜,🟧,⬆,➡,⬇,⬅");
    const svgMode = ref((query.get("mode") ?? "svg") === "svg");
    const shareLink = computed(() => {
      const q = new URLSearchParams();
      q.set("mode", svgMode.value ? "svg" : "text");
      q.set("range", input.value);
      q.set("chars", characters.value);
      q.set("dir", dir.value);
      return location.origin + location.pathname + "?" + String(q);
    });
    const onClickClipboard = () => {
      navigator.clipboard
        .writeText(shareLink.value)
        .then(() => {
          ElMessage({
            message: "已复制分享链接到剪贴板",
            showClose: true,
            type: "success",
            duration: 1000,
          });
        })
        .catch(() => {
          ElMessage({
            duration: 1000,
            message: "复制失败",
            showClose: true,
            type: "error",
          });
        });
    };

    return {
      docs,
      range,
      input,
      dir,
      onClickClipboard,
      width: ref(1),
      height: ref(1),
      svgAspectRatio: ref([10, 10]),
      svgMode,
      shareLink,
      dirChinese,
      maskY,
      characters,
      evenOffset,
      t,
      errorMsg,
      error,
    };
  },
  data() {
    return {
      // characters: '⬜,🟧,⬆,➡,⬇,⬅',
      svgAspectRatio: [10, 10],
      width: 1,
      height: 1,
      dir: "r" as keyof typeof directions,
      svgMode: true,
    };
  },
  methods: {
    handleScroll(e: WheelEvent): void {
      const { deltaY: dy } = e;
      this.svgAspectRatio = this.svgAspectRatio.map((n) => {
        return clip(n + map(-dy, [-200, 200], [-1, 1]), [5, 50]);
      });
    },
    angle: function (direction: keyof typeof directions): number {
      switch (direction) {
        case "r":
          return 0;
        case "b":
          return 90;
        case "t":
          return -90;
        case "l":
          return 180;
      }
    },
  },
  computed: {
    svgViewBox(): Array<number> {
      const center = this.svgAspectRatio.map((i) => -i / 2);
      return [...center, ...this.svgAspectRatio];
    },
    rangeString(): string {
      if (!this.range.length) return "";
      const points = [...this.range];

      const { minX, minY, maxX, maxY } = corners(points);
      let result = [];
      // characters: "⬜,🟧,⬆,➡,⬇,⬅",
      const [
        blank = "⬜",
        filled = "🟧",
        t = "⬆",
        r = "➡",
        b = "⬇",
        l = "⬅",
      ] = this.characters.split(",");
      const dir = { t, r, b, l };
      const width = maxX - minX;
      const height = maxY - minY;

      const chars: string[][] = [];
      for (let y = minY; y <= maxY; y++) {
        const arr: string[] = [];
        chars.push(arr);
        for (let x = minX; x <= maxX; x++) {
          arr.push(blank);
        }
      }

      for (const p of [...this.range]) {
        const v = { x: p.x + -minX, y: p.y + -minY };
        chars[v.y][v.x] = filled;
      }
      chars[-minY][-minX] = dir[this.dir];

      const str = chars.map((arr) => arr.join("")).join("\n");

      return str;
    },
  },
});
</script>

<style lang="scss">
$emoji: apple color emoji, segoe ui emoji, noto color emoji, android emoji,
  emojisymbols, emojione mozilla, twemoji mozilla, segoe ui symbol;

.container {
  margin-top: 2vw;
}

.svg-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 700px;

  margin-top: 2vw;
  border-radius: 8px;

  svg {
    border: 1px pink solid;
    height: 100%;
    width: 100%;
    cursor: pointer;
  }
}

.emoji {
  font-family: $emoji;
}

.text-container,
.text-container > * {
  line-height: 1.1em;
  cursor: pointer;
  white-space: pre;
  margin: 20px 0;
  font-family: $emoji;
}
</style>
