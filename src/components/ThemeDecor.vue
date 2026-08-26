<script setup lang="ts">
/** 主题氛围层：六套主题各有独一无二的"环境艺术"，不只是换色 */
defineProps<{ theme: string }>()
</script>

<template>
  <div class="decor-root" aria-hidden="true">
    <!-- 玄夜鎏金：星宿连线（non-scaling-stroke：高视口下 slice 放大不再把线吹粗） -->
    <svg v-if="theme === 'xuan'" class="ly ly-xuan" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <g stroke="rgba(232,196,115,.3)" stroke-width=".8" fill="none" vector-effect="non-scaling-stroke">
        <path d="M60 60 L110 42 L150 78 L128 118" vector-effect="non-scaling-stroke" />
        <path d="M300 50 L342 88 L320 132 L268 108 Z" vector-effect="non-scaling-stroke" />
        <path d="M210 200 L252 232 L310 214" vector-effect="non-scaling-stroke" />
      </g>
      <g fill="#ffe3a8" opacity=".55">
        <circle v-for="(p, i) in [[60,60],[110,42],[150,78],[128,118],[300,50],[342,88],[320,132],[268,108],[210,200],[252,232],[310,214]]" :key="i" :cx="p[0]" :cy="p[1]" r="1.1" />
      </g>
    </svg>

    <!-- 月白道袍：流云弧纹 -->
    <svg v-if="theme === 'yue'" class="ly" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice">
      <g stroke="rgba(58,110,165,.35)" stroke-width="1.1" fill="none" stroke-linecap="round">
        <path d="M-20 210 Q60 178 140 206 T320 202 T430 216" />
        <path d="M-20 228 Q70 198 156 224 T330 220 T430 236" />
        <path d="M40 96 q28 -22 56 -2 q-10 -30 18 -38 q30 -8 40 20 q26 -14 44 12" />
      </g>
    </svg>

    <!-- 朱砂符箓：垂符与印 -->
    <div v-if="theme === 'zhu'" class="ly ly-zhu">
      <span v-for="i in 3" :key="i" class="fu-strip" :style="{ left: `${8 + i * 13}%`, animationDelay: `${i * 0.9}s` }">敕</span>
      <span class="fu-seal">天工</span>
    </div>

    <!-- 松烟水墨：远山淡墨 -->
    <svg v-if="theme === 'shui'" class="ly" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice">
      <circle cx="308" cy="64" r="30" fill="rgba(122,158,159,.22)" />
      <path d="M-10 236 Q70 176 130 218 Q170 150 236 196 Q280 160 330 208 Q372 186 420 222 L420 250 L-10 250 Z" fill="rgba(90,100,105,.16)" />
      <path d="M-10 244 Q80 206 150 236 Q210 190 276 230 Q330 204 420 240 L420 256 L-10 256 Z" fill="rgba(58,66,72,.2)" />
    </svg>

    <!-- 紫霄星穹：星云双晕 -->
    <div v-if="theme === 'zi'" class="ly ly-zi">
      <i class="neb n1"></i>
      <i class="neb n2"></i>
    </div>

    <!-- 青梅烟雨：雨丝梅枝 -->
    <div v-if="theme === 'qing'" class="ly ly-qing">
      <div class="rain"></div>
      <svg class="plum" viewBox="0 0 220 180">
        <path d="M210 12 Q150 46 120 96 Q104 124 76 138" stroke="rgba(60,44,36,.55)" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M150 52 Q128 40 116 48 M126 84 Q104 74 94 82" stroke="rgba(60,44,36,.45)" stroke-width="3.4" fill="none" />
        <g fill="#e8a4b8">
          <circle v-for="(p, i) in [[146,44],[118,54],[122,86],[96,92],[74,136]]" :key="i" :cx="p[0]" :cy="p[1]" r="6.5" />
        </g>
        <g fill="#fff0f4">
          <circle v-for="(p, i) in [[146,44],[118,54],[122,86],[96,92],[74,136]]" :key="'c' + i" :cx="p[0]" :cy="p[1]" r="2.2" />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.decor-root { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.ly { position: absolute; inset: 0; width: 100%; height: 100%; }

.ly-zhu .fu-strip {
  position: absolute;
  top: 0;
  width: 30px;
  height: 148px;
  background: linear-gradient(180deg, rgba(255,122,92,.14), rgba(255,122,92,.03));
  border: 1px solid rgba(255,122,92,.32);
  border-top: none;
  border-radius: 0 0 6px 6px;
  color: rgba(255,164,130,.6);
  font-family: var(--serif);
  font-size: 15px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
  writing-mode: vertical-rl;
  letter-spacing: 8px;
  animation: fu-sway 5.5s ease-in-out infinite;
  transform-origin: top center;
}
@keyframes fu-sway {
  0%, 100% { transform: rotate(-1.6deg); }
  50% { transform: rotate(1.8deg); }
}
.ly-zhu .fu-seal {
  position: absolute;
  right: 7%;
  bottom: 12%;
  width: 54px;
  height: 54px;
  border: 2.5px solid rgba(255,92,92,.4);
  border-radius: 8px;
  color: rgba(255,122,110,.5);
  font-family: var(--serif);
  font-size: 17px;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-7deg);
  line-height: 1.15;
}

.ly-zi .neb { position: absolute; border-radius: 50%; filter: blur(70px); }
.ly-zi .n1 { width: 44vmax; height: 30vmax; right: -12vmax; top: -10vmax; background: radial-gradient(closest-side, rgba(139,109,255,.24), transparent); animation: neb-drift 16s ease-in-out infinite alternate; }
.ly-zi .n2 { width: 36vmax; height: 26vmax; left: -10vmax; bottom: -8vmax; background: radial-gradient(closest-side, rgba(125,232,195,.15), transparent); animation: neb-drift 21s ease-in-out infinite alternate-reverse; }
@keyframes neb-drift { to { transform: translate(-4vmax, 3vmax) scale(1.08); } }

.ly-qing .rain {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(102deg, transparent 0 26px, rgba(160,200,215,.09) 26px 27px, transparent 27px 54px);
  animation: rain-fall 1.05s linear infinite;
}
@keyframes rain-fall { from { background-position: 0 0; } to { background-position: -14px 120px; } }
.ly-qing .plum { position: absolute; right: 2%; top: 0; width: min(230px, 30vw); opacity: .85; }

@media (prefers-reduced-motion: reduce) {
  .fu-strip, .rain, .neb { animation: none !important; }
}
</style>
