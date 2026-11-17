const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'src/AgentOperationsMotion.ts'), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const sandbox = { exports: {} }
vm.runInNewContext(js, sandbox)
const { evaluateAgentWalkthrough: at, TOTAL_MS, BEATS, GEOMETRY, MOTION_CURVES, cubicBezier } = sandbox.exports
let assertions = 0
const check = (condition, label) => { assertions++; assert(condition, label) }
const close = (a, b, tolerance, label) => check(Math.abs(a - b) < tolerance, `${label}: ${a} vs ${b}`)
const boundaries = [...new Set(Object.values(BEATS).flat())].sort((a, b) => a - b)
const sizes = [{ w: 1200, h: 900 }, { w: 1334, h: 520 }, { w: 655, h: 440 }, { w: 390, h: 500 }]
const matrixFields = ['s', 'tx', 'ty']
const poseFields = ['x', 'y', 'scale', 'rotation']
check(TOTAL_MS === 17310, 'exact complete cycle')
check(BEATS.readingHold[1] - BEATS.readingHold[0] === 4580, 'stationary read interval')
for (const curve of Object.values(MOTION_CURVES)) {
 check(cubicBezier(0, curve) === 0 && cubicBezier(1, curve) === 1, 'exact bezier endpoints')
 let previous = 0
 for (let i = 0; i <= 100; i++) { const next = cubicBezier(i / 100, curve); check(next >= previous - 1e-8 && next <= 1, 'monotonic curve'); previous = next }
}
// This nontrivial X curve distinguishes a correct CSS sampler from a direct Y-at-time evaluation.
close(cubicBezier(0.5, MOTION_CURVES.enter), 0.96598256, 0.00001, 'CSS-equivalent cubic sampler')
for (const size of sizes) {
 const f = time => at(time, size)
 for (let t = 0; t < TOTAL_MS; t += 17) {
  const frame = f(t)
  for (const key of matrixFields) check(Number.isFinite(frame.camera[key]), `finite camera ${key}`)
  for (const key of poseFields) check(Number.isFinite(frame.cardPose[key]), `finite card ${key}`)
  check(frame.camera.s > 0, 'positive scale')
  check(frame.made >= 0 && frame.made <= 14, 'count bounds')
  check(frame.sceneOpacity === 1, 'Safari stays opaque')
 }
 for (const t of boundaries) {
  if (t === 0 || t === TOTAL_MS || t === 17230) continue // concealed reset is deliberately discontinuous
  const before = f(t - 0.001), after = f(t + 0.001)
  if (before.cardOpacity > 0 || after.cardOpacity > 0) {
   for (const key of ['x', 'y']) close(before.cardPose[key], after.cardPose[key], 0.1, `pose ${key} @${t}`)
   close(before.cardPose.scale, after.cardPose.scale, 0.001, `pose scale @${t}`)
   close(before.cardPose.rotation, after.cardPose.rotation, 0.01, `pose rotation @${t}`)
  }
  for (const key of ['tx', 'ty']) close(before.camera[key], after.camera[key], 0.1, `camera ${key} @${t}`)
  close(before.camera.s, after.camera.s, 0.001, `camera scale @${t}`)
 }
 check(f(2639.999).stage === 'Queue' && f(2640).stage === 'Building', 'build commit at impact')
 check(f(7249.999).stage === 'Building' && f(7250).stage === 'For review', 'review commit at impact')
 check(f(13440).modal.approved && f(13440).stage === 'For review', 'approved before complete')
 check(f(15259.999).stage === 'For review' && f(15260).stage === 'Complete', 'complete commit at impact')
 check(f(2860).buildProgress === 0 && f(6160).buildProgress === 1, 'build endpoints')
 let prior = 0
 for (let t = 2860; t <= 6160; t++) { const next = f(t); check(next.buildProgress >= prior, 'monotone fill'); prior = next.buildProgress }
 check(f(4000).made === f(4001).made && f(4000).buildProgress !== f(4001).buildProgress, 'continuous fill, discrete number')
 for (const [start, end, from] of [[1940,2640,0],[6500,7250,1],[14560,15260,2]]) {
  const scale = f(start).camera.s
  for (let t = start; t < end; t += 19) {
   const frame = f(t)
   close(frame.columnOccupancy[from] + frame.columnOccupancy[from + 1], 1, 1e-9, 'complementary slot space')
   if (size.w >= 500 && start < 10000) close(frame.camera.s, scale, 1e-9, 'constant focus scale during drag')
  }
 }
 for (let t = 1230; t < 8150; t += 23) {
  if (size.w < 500) continue
  const frame = f(t), p = frame.cardPose, angle = p.rotation * Math.PI / 180
  const dx = GEOMETRY.CARD_W / 2 - GEOMETRY.GRIP_X, dy = GEOMETRY.CARD_H / 2 - GEOMETRY.GRIP_Y
  const visualX = p.x + GEOMETRY.GRIP_X + p.scale * (Math.cos(angle) * dx - Math.sin(angle) * dy)
  close(visualX * frame.camera.s + frame.camera.tx, 0.54 * size.w, 0.5, 'locked focal center')
 }
 for (const [impact, column] of [[2640,1],[7250,2],[15260,3]]) {
  const frame = f(impact)
  check(frame.columnOccupancy[column] === 1, 'destination slot reserved at impact')
  check(GEOMETRY.CARD_Y + frame.columnOccupancy[column] * GEOMETRY.ROW_STEP >= frame.cardPose.y + GEOMETRY.CARD_H, 'background card below arriving card')
 }
 const settled = f(8700)
 for (let t = 8700; t < 13280; t += 127) {
  const frame = f(t)
  check(frame.modal.visible && frame.modal.opacity === 1 && !frame.modal.approved, 'readable unapproved modal')
  for (const key of matrixFields) close(frame.camera[key], settled.camera[key], 1e-9, 'still camera during reading')
 }
 for (const [start, end, property] of [[8070,8490,'reviewRippleVisible'],[13280,13700,'approveRippleVisible']]) {
  check(!f(start - 0.001)[property] && f(start)[property] && f(end - 0.001)[property] && !f(end)[property], 'complete 420ms ripple lifetime')
 }
 check(f(14419.999).modal.visible && !f(14420).modal.visible, 'close modal before pickup')
 for (let t = 17230; t < TOTAL_MS; t += 1) {
  const frame = f(t)
  check(Object.values(frame.entrances).every(e => e.opacity === 0) && frame.cardOpacity === 0, 'reset is concealed')
 }
 const reduced = at(0, size, true)
 check(reduced.made === 14 && reduced.stage === 'For review', 'reduced motion review-ready poster')
 check(reduced.contactOpacity === 0 && reduced.cardPose.rotation === 0 && !reduced.reviewRippleVisible, 'reduced motion no gesture')
}
for (const size of [{ w:0,h:0 },{ w:100,h:0 },{ w:NaN,h:100 }]) {
 const frame = at(2000,size)
 check(frame.sceneOpacity === 0 && frame.camera.s === 1 && frame.camera.tx === 0 && frame.camera.ty === 0, 'stable hidden invalid-size result')
}
// Clock/pause is a React integration behavior; assert the retained-clock architecture and let browser QA test scheduling.
const component = fs.readFileSync(path.join(root,'src/AgentOperationsDemo.tsx'),'utf8')
check(component.includes('return()=>cancelAnimationFrame(raf)'), 'rAF cleanup')
check(component.includes('let raf=0,last=performance.now()'), 'fresh resume timestamp')
check(component.includes('if(!playing||reduced)return'), 'no clock while paused or reduced')
check(component.includes('key!==lastRenderKey.current'), 'React updates gated by semantic key')
console.log(`Passed ${assertions} checks: curves, four viewport sizes, visible handoff continuity, status timing, continuous progress, read hold, approval, ripple lifetimes, hidden reset and reduced poster.`)
