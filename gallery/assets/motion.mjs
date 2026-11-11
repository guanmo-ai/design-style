/* Native Web Animations adapter. Amicro spring presets and Fluent UI motion
   tokens are used under MIT; see ./licenses/ and ../NOTICE.md. */
export const motionTokens = {
  durationFast:150, durationNormal:200, durationSlow:300, durationSlower:400,
  curveDecelerateMax:'cubic-bezier(0.1,0.9,0.2,1)',
  curveAccelerateMin:'cubic-bezier(0.8,0,0.78,1)',
};
export const springs = {
  snappy:{stiffness:400, damping:28, mass:0.8},
  smooth:{stiffness:220, damping:24, mass:1},
};

// Sample the damped spring so WAAPI can run transforms on the compositor.
export function springFrames(from, to, property, preset = springs.smooth, duration = 600) {
  const {stiffness:k, damping:c, mass:m} = preset;
  const omega = Math.sqrt(k / m);
  const decay = c / (2 * m);
  const frequency = Math.sqrt(omega ** 2 - decay ** 2);
  const count = Math.ceil(duration / (1000 / 60));
  return Array.from({length:count + 1}, (_, i) => {
    const time = i / count * duration / 1000;
    const progress = i === count ? 1 : 1 - Math.exp(-decay * time) * (Math.cos(frequency * time) + decay / frequency * Math.sin(frequency * time));
    return {[property]:from.map((value, index) => value + (to[index] - value) * progress)};
  });
}

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const channels = new WeakMap();
const running = new Set();
export function animate(node, keyframes, options = {}, channel = 'motion') {
  if (!node) return Promise.resolve();
  let animations = channels.get(node);
  if (!animations) channels.set(node, animations = new Map());
  const previous = animations.get(channel);
  previous?.cancel();
  running.delete(previous);
  if (reducedMotion.matches || !node.animate) return Promise.resolve();
  const animation = node.animate(keyframes, {duration:motionTokens.durationSlow, easing:motionTokens.curveDecelerateMax, ...options});
  animations.set(channel, animation);
  running.add(animation);
  return animation.finished.catch(() => {}).finally(() => {
    if (options.fill === 'forwards' && animation.playState === 'finished') return;
    running.delete(animation);
    if (animations.get(channel) === animation) animations.delete(channel);
  });
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) for (const animation of running) animation.cancel();
  if (reducedMotion.matches) running.clear();
});

export function captureLayout(container) {
  const before = new Map();
  for (const node of container.children) {
    const rect = node.getBoundingClientRect();
    before.set(node, {rect, visible:rect.bottom > 0 && rect.top < innerHeight});
    channels.get(node)?.get('motion')?.cancel();
  }
  return before;
}

export function animateLayout(container, before) {
  if (reducedMotion.matches) return;
  let entered = 0;
  for (const node of container.children) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) continue;
    const previous = before.get(node);
    if (previous?.visible) {
      const x = previous.rect.left - rect.left, y = previous.rect.top - rect.top;
      if (Math.abs(x) + Math.abs(y) > 1) {
        const frames = springFrames([x,y], [0,0], 'offset').map(({offset:[x,y]}) => ({transform:`translate(${x}px,${y}px)`}));
        animate(node, frames, {duration:600,easing:'linear'});
      }
    } else {
      animate(node, [{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'none'}], {duration:400,delay:Math.min(entered++, 7)*28,fill:'backwards'});
    }
  }
}

export function animateDeparture(node) {
  const rect = node.getBoundingClientRect();
  if (reducedMotion.matches || rect.bottom < 0 || rect.top > innerHeight) return;
  const ghost = node.cloneNode(true);
  ghost.className = 'work-departure';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  for (const video of ghost.querySelectorAll('video')) video.remove();
  ghost.style.cssText = `position:fixed;pointer-events:none;z-index:3;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  document.body.append(ghost);
  animate(ghost, [{opacity:.7,transform:'none'},{opacity:0,transform:'translateY(-8px) scale(.97)'}], {duration:motionTokens.durationFast}).finally(() => ghost.remove());
}

export function moveIndicator(nav) {
  const active = nav.querySelector('[aria-pressed="true"]');
  if (!active) return;
  let indicator = nav.querySelector('.type-indicator');
  const old = indicator?.getBoundingClientRect();
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'type-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.prepend(indicator);
  }
  const box = active.getBoundingClientRect(), base = nav.getBoundingClientRect();
  Object.assign(indicator.style, {width:`${box.width}px`,height:`${box.height}px`,left:`${box.left-base.left}px`,top:`${box.top-base.top}px`});
  if (old) {
    const frames = springFrames([old.left-box.left,old.top-box.top,old.width/box.width], [0,0,1], 'offset', springs.snappy, 450)
      .map(({offset:[x,y,s]}) => ({transform:`translate(${x}px,${y}px) scaleX(${s})`}));
    animate(indicator, frames, {duration:450,easing:'linear'});
  }
}

const closing = new WeakMap();
export function openDialog(dialog, trigger) {
  const wasClosing = closing.has(dialog);
  closing.delete(dialog);
  dialog.classList.remove('is-closing');
  if (dialog.open) {
    if (wasClosing) animate(dialog, [{transform:getComputedStyle(dialog).transform,opacity:getComputedStyle(dialog).opacity},{transform:'none',opacity:1}], {}, 'dialog');
    return;
  }
  const source = trigger?.getBoundingClientRect();
  dialog.showModal();
  const target = dialog.getBoundingClientRect();
  const x = source ? source.left + source.width/2 - target.left - target.width/2 : 0;
  const y = source ? source.top + source.height/2 - target.top - target.height/2 : 20;
  const scale = source ? Math.max(.65, Math.min(.94, source.width / target.width)) : .96;
  const frames = springFrames([x,y,scale], [0,0,1], 'offset').map(({offset:[x,y,s]}, i, frames) => ({transform:`translate(${x}px,${y}px) scale(${s})`,opacity:Math.min(1,.2+i/frames.length*3)}));
  animate(dialog, frames, {duration:600,easing:'linear'}, 'dialog');
}

export function closeDialog(dialog) {
  if (!dialog.open || closing.has(dialog)) return;
  const token = {};
  closing.set(dialog, token);
  dialog.classList.add('is-closing');
  const transform = getComputedStyle(dialog).transform;
  const opacity = getComputedStyle(dialog).opacity;
  animate(dialog, [{transform,opacity},{transform:'translateY(12px) scale(.97)',opacity:0}], {duration:motionTokens.durationFast,easing:motionTokens.curveAccelerateMin}, 'dialog').then(() => {
    if (closing.get(dialog) !== token) return;
    closing.delete(dialog);
    dialog.classList.remove('is-closing');
    dialog.close();
  });
}

export function installPressFeedback() {
  let pressed;
  function release() {
    if (!pressed) return;
    const node = pressed;
    pressed = undefined;
    const transform = getComputedStyle(node).transform;
    animate(node, [{transform},{transform:'none'}], {duration:350}, 'press');
  }
  function press(target) {
    release();
    const node = target.closest('button:not(:disabled),a');
    if (!node || reducedMotion.matches) return;
    pressed = node;
    animate(node, [{transform:getComputedStyle(node).transform},{transform:`scale(${node.matches('.card-open') ? '.985' : '.95'})`}], {duration:100,fill:'forwards'}, 'press');
  }
  document.addEventListener('pointerdown', event => {if (event.button === 0) press(event.target);});
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
  document.addEventListener('keydown', event => {if (['Enter',' '].includes(event.key) && !event.repeat) press(event.target);});
  document.addEventListener('keyup', event => {if (['Enter',' '].includes(event.key)) release();});
}
