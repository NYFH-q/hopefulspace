/** @type {import('tailwindcss').Config} */
export default {
  // content：告诉 Tailwind 去哪些文件里“找”你写过的 class 名，
  // 只保留真正用到的样式，这叫 Tree-Shaking（摇树优化），别写错路径。
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // 整套项目的“柔和色板”，在 JSX 里用 bg-cream、text-mist 这类名字
      colors: {
        cream: {
          DEFAULT: '#FDFAF3', // 奶白主背景
          soft: '#F7F1E6',    // 比奶白深一点的暖底色
        },
        lavender: {
          DEFAULT: '#EFEAFA', // 淡紫（浅）
          deep: '#B9A8E8',    // 淡紫（稍深，做文字/边框）
        },
        mint: {
          DEFAULT: '#E2F3EA', // 浅薄荷
          deep: '#7FC7A9',
        },
        gold: {
          DEFAULT: '#F7EBD3', // 暖金
          deep: '#D9B36C',
        },
        mist: {
          DEFAULT: '#E4EEF6', // 雾蓝
          deep: '#94B8D8',
        },
        ink: '#4A4458', // 全站主要文字色：柔和的深灰紫，避免纯黑太刺眼
        softink: '#8B8399', // 次要文字：更浅的灰紫
      },
      borderRadius: {
        // 大圆角是 UI 铁律之一，自定义几个档位
        card: '1.75rem', // 卡片圆角 28px
        pill: '9999px', // 药丸形按钮
      },
      boxShadow: {
        // hover 时的“轻微上浮 + 淡阴影”，禁止闪烁/爆炸动效
        lift: '0 6px 18px -8px rgba(74, 68, 88, 0.15)',
        soft: '0 2px 10px -6px rgba(74, 68, 88, 0.10)',
      },
    },
  },
  plugins: [],
}
