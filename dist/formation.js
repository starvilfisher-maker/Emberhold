import {DragGesture} from './interaction.js';

export function bindFormation({canvas, bench, world, game, ready, getSelected, select, inspect, act, close, clickGround, toast, defs}) {
  const gesture = new DragGesture(8);
  const label = document.querySelector('#drag-label');
  let previous = null;
  const pick = event => game().deployed().map(unit => {
    const p = world.screenAt(unit.x, unit.z, .9);
    return {unit, distance: Math.hypot(p.x - event.clientX, p.y - event.clientY)};
  }).filter(item => item.distance < (event.pointerType === 'touch' ? 30 : 24))
    .sort((a, b) => a.distance - b.distance)[0]?.unit;
  const clearPreview = () => {
    world.setPlacementPreview(null);
    label.hidden = true;
    document.body.classList.remove('dragging-unit');
    bench.classList.remove('drop-ready', 'drop-blocked');
  };
  const release = current => {
    if (current && canvas.hasPointerCapture(current.pointerId)) canvas.releasePointerCapture(current.pointerId);
  };
  const cancel = () => {
    const current = gesture.cancel();
    if (current?.dragging) select(previous);
    clearPreview();
    release(current);
  };
  const dropAt = event => {
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const unit = game().state.units.find(u => u.id === gesture.current?.unitId);
    if (under?.closest('#bench')) {
      const full = game().state.units.filter(u => !u.slot).length >= 8;
      return {bench: true, ok: !!unit && (!unit.slot || !full), message: full && unit?.slot ? '备战席已满，松开取消' : '松开撤回备战席'};
    }
    if (under !== canvas) return {ok: false, message: '移到战场方格 · Esc 取消'};
    // Model heads project above their ground cell; snap to the hovered unit for swaps.
    const hovered = pick(event);
    const point = hovered && hovered.id !== unit?.id ? hovered.slot : world.groundAt(event.clientX, event.clientY);
    return {...game().placement(unit?.id, point?.x, point?.z), point};
  };
  const begin = (event, unitId, source) => {
    if (!ready() || event.button !== 0 || event.isPrimary === false) return;
    if (game().state.phase !== 'day') unitId = null;
    if (!gesture.begin(event.pointerId, event.clientX, event.clientY, unitId, source)) return;
    previous = getSelected();
    canvas.setPointerCapture(event.pointerId);
    if (unitId) event.preventDefault();
  };
  canvas.addEventListener('pointerdown', event => begin(event, pick(event)?.id, 'world'));
  bench.addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-unit]');
    if (button) begin(event, button.dataset.unit, 'bench');
  });
  document.addEventListener('pointermove', event => {
    const current = gesture.move(event.pointerId, event.clientX, event.clientY);
    if (!current?.unitId || !current.dragging || !ready()) return;
    event.preventDefault();
    close();
    select(current.unitId);
    document.body.classList.add('dragging-unit');
    const unit = game().state.units.find(u => u.id === current.unitId);
    if (!unit) { cancel(); return; }
    const drop = dropAt(event);
    world.setPlacementPreview(drop.point ? unit : null, drop, drop.point);
    bench.classList.toggle('drop-ready', !!drop.bench && drop.ok);
    bench.classList.toggle('drop-blocked', !!drop.bench && !drop.ok);
    label.hidden = false;
    label.classList.toggle('invalid', !drop.ok);
    label.textContent = `${defs[unit.def].name} ${'★'.repeat(unit.star)} · ${drop.message}`;
    label.style.left = Math.max(10, Math.min(innerWidth - 260, event.clientX + 16)) + 'px';
    label.style.top = Math.max(10, event.clientY - 54) + 'px';
  }, {passive: false});
  document.addEventListener('pointerup', event => {
    const pending = gesture.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    const drop = pending.unitId ? dropAt(event) : null;
    const current = gesture.end(event.pointerId, event.clientX, event.clientY);
    clearPreview();
    release(current);
    if (!ready()) return;
    if (current.unitId && current.dragging) {
      event.preventDefault();
      if (drop.ok) {
        const unit = game().state.units.find(u => u.id === current.unitId);
        if (drop.bench) { if (unit?.slot) act(game().recall(unit.id)); }
        else act(game().deploy(current.unitId, drop.x, drop.z));
        select(null);
      } else { select(previous); toast(drop.message); }
      close();
    } else if (!current.dragging) {
      if (current.source === 'bench') { select(current.unitId); inspect(current.unitId); }
      else clickGround(event, pick(event));
    }
  });
  canvas.addEventListener('lostpointercapture', event => {
    if (gesture.current?.pointerId === event.pointerId) cancel();
  });
  document.addEventListener('pointercancel', event => {
    if (gesture.current?.pointerId === event.pointerId) cancel();
  });
  window.addEventListener('blur', cancel);
  window.addEventListener('resize', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  return {cancel, active: () => !!gesture.current};
}
