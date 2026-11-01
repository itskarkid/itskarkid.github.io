---
title: Padding
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-26
lastTended: 2026-11-01
tags:
  - course-note
  - machine-vision
  - image-processing
  - convolution
  - padding
publish: true
---
**Padding** adds extra pixels around the border of an image so the kernel can also process edge pixels.

> [!summary]- Mental Model
> ![[padding.png]]

Without padding, the kernel cannot fully fit at the image boundary.

Suppose the image is:

```text
10 20 30
40 50 60
70 80 90
```

If a `3×3` kernel is centered on the top-left pixel, some values would lie outside the image:

```text
?  ?  ?
? 10 20
? 40 50
```

Padding provides values for those missing positions.

## Zero Padding

Add zeros around the image:

```text
0  0  0  0  0
0 10 20 30  0
0 40 50 60  0
0 70 80 90  0
0  0  0  0  0
```

Now the kernel can also be centred on edge pixels.

So:

```text
without padding
→ fewer valid kernel positions
→ smaller output

with padding
→ edge pixels can be processed
→ output size can be preserved
```

For odd-sized kernels with stride 1 and no dilation, symmetric padding on each side preserves image size when:

$$
P=\frac{K-1}{2}  
$$

where:

```text
P = padding
K = kernel size
```

Apply the rule separately to image height and width. It does not generally preserve size when the stride is larger than 1.

Examples:

```text
3×3 kernel → padding 1

5×5 kernel → padding 2

7×7 kernel → padding 3
```

Padding is not always zero.

Common padding types are:

```text
Zero
→ add 0 outside the image

Replicate
→ repeat the nearest edge value

Reflect
→ mirror nearby image values
```

### Why does this matter?

Because padded values are also used in the kernel calculation.

For example:

```text
zero padding
→ may make bright edges darker

replicate padding
→ keeps edge values more consistent

reflect padding
→ often gives smoother boundaries
```

The key mental model is:

```text
Padding
→ controls what the kernel sees outside the real image boundary
```

And together:

```text
Kernel size
→ how much area is seen

Stride
→ how far the kernel moves

Padding
→ what happens at the border
```
