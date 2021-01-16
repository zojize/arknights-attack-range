<template>
  <div class="container">
    <el-row :gutter="20">
      <el-col
        :span="6"
        :offset="1"
      >
        <el-tooltip
          effect="dark"
          content="输入内容"
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
      <div
        class="svg-container"
        v-if="svgMode"
      >
        <svg
          ref="svg"
          :viewBox="svgViewBox.join(' ')"
          @mousewheel="handleScroll"
          xmlns="http://www.w3.org/2000/svg"
          style="width: 50vw; height: 50vw; max-height: 80vh;"
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
            <!-- eslint-disable vue/require-v-for-key -->
            <rect
              v-for="v in [0.6, 0.3, 0, -0.3, -0.6]"
              fill="#000"
              x="0"
              y="0"
              width="500%"
              height="0.15"
              :transform="`rotate(35) translate(0 ${v})`"
            />
          </mask>
          <template v-if="range.length">
            <template v-for="r of range">
              <!-- eslint-disable vue/require-v-for-key -->
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
              <!-- eslint-disable vue/require-v-for-key -->
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
      </div>
      <div
        class="text-container"
        style="line-height: 1.1em; white-space: pre; margin: 20px 0;"
        v-else
      >{{rangeString}}</div>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { parseAttackRange, Vector, map, clip, Directions } from "../utils";
import { rect, SVGPosition } from "../utils/svg";

function corners(pts: Vector[]) {
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
    const route = useRoute();
    let input = ref(
      (route.query.input as string) ??
        "-3 3-1 1-3&1+1 1+2&1-3 1-2&1+3 1+2&1-3 1-3&1+1 3-1"
    );
    const dirChinese = ref("右" as "右" | "左" | "上" | "下");
    const dir = computed(
      () => ({ 右: "r", 左: "l", 上: "t", 下: "b" }[dirChinese.value])
    );

    const range = computed(() => {
      let ret: any[];
      try {
        ret = parseAttackRange(input.value, {
          charDir: dir.value as keyof typeof Directions,
        });
      } catch (error) {
        ret = [];
      }
      return ret;
    });

    return {
      input,
      dir,
      width: ref(1),
      height: ref(1),
      svgAspectRatio: ref([10, 10]),
      svgMode: ref(true),
      dirChinese,
    };
  },
  data() {
    const input =
      this.$route.query.range ??
      "-3 3-1 1-3&1+1 1+2&1-3 1-2&1+3 1+2&1-3 1-3&1+1 3-1";

    return {
      input,
      characters: "⬜,🟧,⬆,➡,⬇,⬅",
      svgAspectRatio: [10, 10],
      width: 1,
      height: 1,
      dir: "r" as keyof typeof Directions,
      svgMode: true,
    };
  },
  methods: {
    handleScroll(e: WheelEvent): void {
      e.preventDefault();
      const { deltaY: dy } = e;
      this.svgAspectRatio = this.svgAspectRatio.map((n) => {
        return clip(n + map(-dy, [-200, 200], [-1, 1]), [5, 50]);
      });
    },
    angle: function (direction: keyof typeof Directions): number {
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
    range(): any[] {
      let ret: any[];
      try {
        ret = parseAttackRange(this.input as string, { charDir: this.dir });
      } catch (error) {
        ret = [];
      }

      return ret;
    },
    svgViewBox(): Array<number> {
      const center = this.svgAspectRatio.map((i) => -i / 2);
      return [...center, ...this.svgAspectRatio];
    },
    rangeString(): string {
      if (!this.range.length) return "";
      const points = [...this.range];
      console.log(points);

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
      for (const s of [blank, filled, t, r, b, l]) if (s.length > 6) return "";
      const dir = { t, r, b, l };
      const width = maxX - minX;
      const height = maxY - minY;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++)
          if (x === 0 && y === 0) result.push(dir[this.dir]);
          else {
            let flag = true;
            for (let i = 0; i < points.length; i++) {
              const pt = points[i];
              if (pt.x === x && pt.y === y) {
                result.push(filled);
                points.splice(i, 1);
                flag = false;
                break;
              }
            }
            if (flag) result.push(blank.replaceAll(" ", "&nbsp;"));
          }
        result.push("\n");
      }

      return result.join("");
    },
  },
});
</script>

<style lang="scss" scoped>
.container {
  margin-top: 2vw;
}

.svg-container {
  width: 100%;
  max-width: 700px;
  height: auto;

  margin-top: 2vw;
  border: 1px pink solid;
  border-radius: 8px;

  svg {
    height: 100%;
    width: 100%;
  }
}
</style>
