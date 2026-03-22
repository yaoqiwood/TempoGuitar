<template>
  <section class="splash-screen">
    <div class="splash-orbit splash-orbit-left"></div>
    <div class="splash-orbit splash-orbit-right"></div>

    <div class="splash-card">
      <p class="eyebrow">TempoGuitar</p>
      <h1>为练琴而生的桌面节拍器</h1>
      <p class="splash-text">
        稳定的节拍、清晰的反馈、顺手的操作，从打开应用的第一秒开始就进入状态。
      </p>
      <div class="splash-status">
        <span class="status-dot"></span>
        <span>正在加载练习工作台</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.splash-screen {
  position: relative;
  overflow: hidden;
  width: min(1120px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  place-items: center;
  padding: 16px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 20% 20%, rgba(223, 172, 83, 0.22), transparent 24%),
    radial-gradient(circle at 80% 30%, rgba(90, 132, 117, 0.2), transparent 26%),
    linear-gradient(140deg, rgba(36, 29, 24, 0.96), rgba(17, 15, 12, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
  box-sizing: border-box;
}

.splash-card {
  position: relative;
  z-index: 1;
  width: min(680px, 100%);
  padding: 32px 30px;
  border-radius: 28px;
  background: rgba(20, 17, 14, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  opacity: 0;
  transform: translateY(24px) scale(0.985);
  animation: splash-card-enter 920ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  box-sizing: border-box;
}

.eyebrow {
  margin: 0 0 12px;
  color: #dfac53;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.76rem;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4.8vw, 4.2rem);
  line-height: 1.02;
  color: #f6edd8;
}

.splash-text {
  margin: 16px 0 0;
  max-width: 520px;
  color: rgba(246, 237, 216, 0.78);
  font-size: 1rem;
  line-height: 1.75;
}

.splash-status {
  margin-top: 24px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(223, 172, 83, 0.12);
  color: rgba(246, 237, 216, 0.82);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #dfac53;
  box-shadow: 0 0 18px rgba(223, 172, 83, 0.65);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.splash-orbit {
  position: absolute;
  border-radius: 999px;
  filter: blur(6px);
  opacity: 0.7;
}

.splash-orbit-left {
  width: 220px;
  height: 220px;
  left: -30px;
  bottom: 8%;
  background: radial-gradient(circle, rgba(223, 172, 83, 0.3), transparent 70%);
  animation: float-orbit 9s ease-in-out infinite;
}

.splash-orbit-right {
  width: 280px;
  height: 280px;
  right: -60px;
  top: 10%;
  background: radial-gradient(circle, rgba(111, 151, 136, 0.22), transparent 68%);
  animation: float-orbit 12s ease-in-out infinite reverse;
}

@keyframes splash-card-enter {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.72;
  }

  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

@keyframes float-orbit {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(0, -18px, 0) scale(1.05);
  }
}

@media (max-width: 640px) {
  .splash-screen {
    padding: 12px;
    border-radius: 22px;
  }

  .splash-card {
    padding: 20px 18px;
    border-radius: 20px;
  }

  .splash-status {
    width: 100%;
    justify-content: center;
  }
}
</style>
