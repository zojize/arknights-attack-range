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
          >{{evenOffset ? 1 : -1}}</el-checkbox>
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
      </el-col>
      <div
        class="text-container"
        style="line-height: 1.1em; white-space: pre; margin: 20px 0;"
        v-else
      >{{rangeString}}</div>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { parseAttackRange, Vector, map, clip, Directions } from '../utils';
import { SVGPosition } from '../utils/svg';

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
    const query = new URLSearchParams(window.location.search);
    let input = ref(query.get('range') ?? '-3 3-1 1-3&1+1 1+2&1-3 1-2&1+3 1+2&1-3 1-3&1+1 3-1');
    const dirChinese = ref('右' as '右' | '左' | '上' | '下');
    const dir = computed(() => ({ 右: 'r', 左: 'l', 上: 't', 下: 'b' }[dirChinese.value]));

    const docs = '请输入内容';
    const evenOffset = ref(true);

    const range = computed(() => {
      let ret: any[];
      try {
        ret = parseAttackRange(input.value, {
          charDir: dir.value as keyof typeof Directions,
          evenOffset: evenOffset.value ? 1 : -1,
        });
      } catch (error) {
        ret = [];
      }
      return ret.length < 1000 ? ret : [{ x: 0, y: 0 }];
    });

    const t = ref(0);
    const helper = () => {
      t.value++;
      requestAnimationFrame(helper);
    };
    helper();
    const maskY = ref(Object.keys([...Array(10)]).map((i) => +i * 0.2));
    const characters = ref(query.get('chars') ?? '⬜,🟧,⬆,➡,⬇,⬅');

    return {
      docs,
      range,
      input,
      dir,
      width: ref(1),
      height: ref(1),
      svgAspectRatio: ref([10, 10]),
      svgMode: ref((query.get('mode') ?? 'svg') === 'svg'),
      dirChinese,
      maskY,
      characters,
      evenOffset,
      t,
    };
  },
  data() {
    return {
      // characters: '⬜,🟧,⬆,➡,⬇,⬅',
      svgAspectRatio: [10, 10],
      width: 1,
      height: 1,
      dir: 'r' as keyof typeof Directions,
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
        case 'r':
          return 0;
        case 'b':
          return 90;
        case 't':
          return -90;
        case 'l':
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
      if (!this.range.length) return '';
      const points = [...this.range];

      const { minX, minY, maxX, maxY } = corners(points);
      let result = [];
      // characters: "⬜,🟧,⬆,➡,⬇,⬅",
      const [
        blank = '⬜',
        filled = '🟧',
        t = '⬆',
        r = '➡',
        b = '⬇',
        l = '⬅',
      ] = this.characters.split(',');
      const dir = { t, r, b, l };
      const width = maxX - minX;
      const height = maxY - minY;
      // for (let y = minY; y <= maxY; y++) {
      //   for (let x = minX; x <= maxX; x++)
      //     if (x === 0 && y === 0) result.push(dir[this.dir]);
      //     else {
      //       let flag = true;
      //       for (let i = 0; i < points.length; i++) {
      //         const pt = points[i];
      //         if (pt.x === x && pt.y === y) {
      //           result.push(filled);
      //           points.splice(i, 1);
      //           flag = false;
      //           break;
      //         }
      //       }
      //       if (flag) result.push(blank.replaceAll(' ', '&nbsp;'));
      //     }
      //   result.push('\n');
      // }

      const chars: string[][] = [];
      for (let y = minY; y <= maxY; y++) {
        const arr: string[] = [];
        chars.push(arr);
        for (let x = minX; x <= maxX; x++) {
          if (x || y) arr.push(blank);
          else arr.push(dir[this.dir]);
        }
      }

      for (const p of [...this.range]) {
        const v = { x: p.x + -minX, y: p.y + -minY };
        chars[v.y][v.x] = filled;
      }
      chars[-minY][-minX] = dir[this.dir];

      const str = chars.map((arr) => arr.join('')).join('\n');

      return str;
    },
  },
});
</script>

<style lang="scss">
$emoji: apple color emoji, segoe ui emoji, noto color emoji, android emoji, emojisymbols,
  emojione mozilla, twemoji mozilla, segoe ui symbol;

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
  }
}

.emoji {
  font-family: $emoji;
}

.text-container,
.text-container > * {
  line-height: 1.1em;
  white-space: pre;
  margin: 20px 0;
  font-family: $emoji;
}
</style>
