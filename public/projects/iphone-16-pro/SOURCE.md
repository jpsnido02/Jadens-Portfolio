# iPhone 16 Pro — Natural Titanium

Source: user-supplied Figma Community mockup
https://www.figma.com/design/pyV1ek20sqthqtgZpE8b2h/?node-id=1-26

Component: `1:26`, bezel image layer: `1:27`.
Downloaded the original PNG asset supplied by Figma design context, unchanged.
PNG: 1350 × 2760 (3× its 450 × 920 Figma layer).
Screen: 402 × 874, offset 24 × 23 inside the frame; component corner radius 44.

`src/IPhoneFrame.tsx` uniformly normalizes that geometry to the existing demos’ 393-point content width. Existing demo content and status bars remain the content layer; only the requested physical bezel is replaced.
