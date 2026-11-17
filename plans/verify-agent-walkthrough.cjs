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
const checkOpening = () => {
 check(BEATS.arrival[0] >= BEATS.firstFocus[1] + 550, 'camera settles before card arrival');
 check(BEATS.arrival[1] - BEATS.arrival[0] >= 1200, 'readable card insertion');
 check(BEATS.queuePickup[0] - BEATS.arrival[1] >= 550, 'settled card hold before pickup');
 for (const size of sizes) {
  const before = at(BEATS.focusHold[0]+100, size);
  check(!before.present && before.columnOccupancy[0] === 0, 'existing queue stays still during focus hold');
  const middle = at((BEATS.queueMakeRoom[0]+BEATS.queueMakeRoom[1])/2, size);
  check(!middle.present && middle.cardOpacity === 0 && middle.columnOccupancy[0] > 0 && middle.columnOccupancy[0] < 1, 'queue makes room before card appears');
  const reveal = at((BEATS.queueReveal[0]+BEATS.queueReveal[1])/2, size);
  check(reveal.present && reveal.columnOccupancy[0] === 1 && reveal.cardOpacity > 0 && reveal.cardOpacity < 1, 'fade into fully reserved slot');
  check(reveal.cardPose.scale > 0.97 && reveal.cardPose.scale < 1, 'subtle expansion into slot');
  close(reveal.cardPose.y + (1-reveal.cardPose.scale)*GEOMETRY.GRIP_Y, GEOMETRY.CARD_Y, 0.001, 'reveal anchored to top of slot');
 }
}
const boundaries = [...new Set(Object.values(BEATS).flat())].sort((a, b) => a - b)
const sizes = [{ w: 1200, h: 900 }, { w: 1334, h: 520 }, { w: 655, h: 440 }, { w: 390, h: 500 }]
const matrixFields = ['s', 'tx', 'ty']
const poseFields = ['x', 'y', 'scale', 'rotation']
checkOpening()
check(TOTAL_MS === 21190, 'exact complete cycle')
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
  if (t === 0 || t === TOTAL_MS || t === BEATS.reset[0]) continue // concealed reset is deliberately discontinuous
  const before = f(t - 0.001), after = f(t + 0.001)
  if (before.cardOpacity > 0 || after.cardOpacity > 0) {
   for (const key of ['x', 'y']) close(before.cardPose[key], after.cardPose[key], 0.1, `pose ${key} @${t}`)
   close(before.cardPose.scale, after.cardPose.scale, 0.001, `pose scale @${t}`)
   close(before.cardPose.rotation, after.cardPose.rotation, 0.01, `pose rotation @${t}`)
  }
  for (const key of ['tx', 'ty']) close(before.camera[key], after.camera[key], 0.1, `camera ${key} @${t}`)
  close(before.camera.s, after.camera.s, 0.001, `camera scale @${t}`)
 }
 check(f(BEATS.queueTravel[1] - 0.001).stage === 'Queue' && f(BEATS.queueTravel[1]).stage === 'Building', 'build commit at impact')
 check(f(BEATS.reviewTravel[1] - 0.001).stage === 'Building' && f(BEATS.reviewTravel[1]).stage === 'For review', 'review commit at impact')
 check(f(BEATS.approvedHold[0]).modal.approved && f(BEATS.approvedHold[0]).stage === 'For review', 'approved before complete')
 check(f(BEATS.completeTravel[1] - 0.001).stage === 'For review' && f(BEATS.completeTravel[1]).stage === 'Complete', 'complete commit at impact')
 check(f(BEATS.build[0]).bestBuyMade === 8 && f(BEATS.build[1]).bestBuyMade === 11, 'Best Buy shares Shutterfly build endpoints')
 close(f(BEATS.build[0]).bestBuyProgress, 8/18, 1e-9, 'Best Buy initial fill')
 close(f(BEATS.build[1]).bestBuyProgress, 11/18, 1e-9, 'Best Buy final fill')
 check(f(BEATS.build[1]+500).bestBuyMade === 11, 'Best Buy holds after build')
 check(f(0).bestBuyMade === 8 && at(0,size,true).bestBuyMade === 11, 'Best Buy reset and reduced-motion poster')
 check(f(BEATS.build[0]).buildProgress === 0 && f(BEATS.build[1]).buildProgress === 1, 'build endpoints')
 let prior = 0
 for (let t = BEATS.build[0]; t <= BEATS.build[1]; t++) { const next = f(t); check(next.buildProgress >= prior, 'monotone fill'); check(next.bestBuyMade === 8+Math.floor(3*next.buildProgress), 'Best Buy synchronized count'); close(next.bestBuyProgress,(8+3*next.buildProgress)/18,1e-9,'Best Buy continuous fill'); prior = next.buildProgress }
 check(f(BEATS.build[0]+410).made === f(BEATS.build[0]+411).made && f(BEATS.build[0]+410).buildProgress !== f(BEATS.build[0]+411).buildProgress, 'continuous fill, discrete number')
 for (const [start, end, from] of [[...BEATS.queueTravel,0],[...BEATS.reviewTravel,1],[...BEATS.completeTravel,2]]) {
  const scale = f(start).camera.s
  for (let t = start; t < end; t += 19) {
   const frame = f(t)
   close(frame.columnOccupancy[from] + frame.columnOccupancy[from + 1], 1, 1e-9, 'complementary slot space')
   if (size.w >= 500 && start < 10000) close(frame.camera.s, scale, 1e-9, 'constant focus scale during drag')
  }
 }
 for (let t = BEATS.firstFocus[1]; t < BEATS.pullback[0]; t += 23) {
  if (size.w < 500) continue
  const frame = f(t), p = frame.cardPose, angle = p.rotation * Math.PI / 180
  const dx = GEOMETRY.CARD_W / 2 - GEOMETRY.GRIP_X, dy = GEOMETRY.CARD_H / 2 - GEOMETRY.GRIP_Y
  const visualX = p.x + GEOMETRY.GRIP_X + p.scale * (Math.cos(angle) * dx - Math.sin(angle) * dy)
  close(visualX * frame.camera.s + frame.camera.tx, 0.54 * size.w, 0.5, 'locked focal center')
 }
 for (const [impact, column] of [[BEATS.queueTravel[1],1],[BEATS.reviewTravel[1],2],[BEATS.completeTravel[1],3]]) {
  const frame = f(impact)
  check(frame.columnOccupancy[column] === 1, 'destination slot reserved at impact')
  check(GEOMETRY.CARD_Y + frame.columnOccupancy[column] * GEOMETRY.ROW_STEP >= frame.cardPose.y + GEOMETRY.CARD_H, 'background card below arriving card')
 }
 const hover = f(BEATS.approvePress[0]).modal, down = f(BEATS.approvedHold[0] - 1).modal
 check(hover.approveHover === 1 && hover.approveScale > 1 && !hover.approved, 'visible hover before pressing')
 check(down.approveScale < 0.95 && down.confirmation === 0, 'depressed button before release')
 check(f(BEATS.approvedHold[0]+120).modal.confirmation > 0 && f(BEATS.approvedHold[0]+120).modal.confirmation < 1, 'green confirmation fades in')
 check(f(BEATS.approvedHold[0]+241).modal.confirmation === 1, 'confirmation settles before dismissal')
 for (const [pickup,landing] of [[BEATS.queuePickup,BEATS.buildingLanding],[BEATS.buildingPickup,BEATS.reviewLanding]]) {
  close(f(pickup[1]).cardPose.scale,1.06,1e-6,'enlarged during carry')
  close(f(landing[0]+160).cardPose.scale,1.03,1e-6,'gradual drop')
  check(f(landing[1]-16).cardPose.scale < 1.001 && f(landing[1]-16).shadowOpacity < 0.01,'soft contact at rest')
 }
 for (let t = BEATS.reviewPickup[0]; t <= BEATS.completeLanding[1]; t += 17) {
  const frame = f(t); check(!frame.held && frame.contactOpacity === 0 && frame.cardPose.scale === 1 && frame.cardPose.rotation === 0, 'automatic completion has no drag gesture');
 }
 const travelStart = BEATS.completeTravel[0], travelDuration = BEATS.completeTravel[1]-travelStart;
 const first = f(travelStart+travelDuration*0.2).cardPose.x-f(travelStart).cardPose.x;
 const last = f(travelStart+travelDuration).cardPose.x-f(travelStart+travelDuration*0.8).cardPose.x;
 const middle = f(travelStart+travelDuration*0.6).cardPose.x-f(travelStart+travelDuration*0.4).cardPose.x;
 check(middle > first*3 && last < middle/3, 'completion accelerates then settles softly');
 const nearEnd = f(BEATS.completeTravel[1]-1).cardPose.x;
 check(Math.abs(f(BEATS.completeTravel[1]).cardPose.x-nearEnd) < 0.01, 'completion reaches zero resting velocity');
 check(f(BEATS.approvedHold[0]+240).modal.lifecycleProgress === 0, 'button confirms before lifecycle fill');
 const progressMid=f((BEATS.lifecycleAdvance[0]+BEATS.lifecycleAdvance[1])/2).modal;
 check(progressMid.lifecycleProgress > 0 && progressMid.lifecycleProgress < 1 && !progressMid.lifecycleComplete,'visible in-flight lifecycle progress');
 check(f(BEATS.lifecycleAdvance[1]).modal.lifecycleComplete && f(BEATS.lifecycleAdvance[1]).modal.visible,'lifecycle finishes before panel closes');
 close(f((BEATS.queueReveal[0]+BEATS.queueReveal[1])/2).cardOpacity,0.5,0.001,'spawn stays visible halfway through fade')
 const settled = f(BEATS.readingHold[0])
 for (let t = BEATS.readingHold[0]; t < BEATS.readingHold[1]; t += 127) {
  const frame = f(t)
  check(frame.modal.visible && frame.modal.opacity === 1 && !frame.modal.approved, 'readable unapproved modal')
  for (const key of matrixFields) close(frame.camera[key], settled.camera[key], 1e-9, 'still camera during reading')
 }
 for (const [start, end, property] of [[BEATS.reviewPress[0],BEATS.reviewPress[0]+420,'reviewRippleVisible'],[BEATS.approvePress[0],BEATS.approvePress[0]+420,'approveRippleVisible']]) {
  check(!f(start - 0.001)[property] && f(start)[property] && f(end - 0.001)[property] && !f(end)[property], 'complete 420ms ripple lifetime')
 }
 check(f(BEATS.modalExit[1]-0.001).modal.visible && !f(BEATS.modalExit[1]).modal.visible, 'close modal before pickup')
 for (let t = BEATS.reset[0]; t < TOTAL_MS; t += 1) {
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
check(component.includes('f.modal.lifecycleComplete||i<2'), 'approval fills every review stage');
check(component.includes('return()=>cancelAnimationFrame(raf)'), 'rAF cleanup')
check(component.includes('let raf=0,last=performance.now()'), 'fresh resume timestamp')
check(component.includes('if(!playing||reduced)return'), 'no clock while paused or reduced')
check(component.includes('key!==lastRenderKey.current'), 'React updates gated by semantic key')
console.log(`Passed ${assertions} checks: curves, four viewport sizes, visible handoff continuity, status timing, continuous progress, read hold, approval, ripple lifetimes, hidden reset and reduced poster.`)
