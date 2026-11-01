---
title: Stride
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
  - stride
publish: true
---
**Stride** is the number of pixels the kernel moves each time. It controls **how far the [[Kernel|kernel]] jumps between calculations**.

> [!summary]- Mental Model
> ![[stride.png]]

## Stride = 1

The kernel moves one pixel at a time.

```text
Position 1

[ K K K ] . .
[ K K K ] . .
[ K K K ] . .

        ↓ move 1 pixel

. [ K K K ] .
. [ K K K ] .
. [ K K K ] .
```

This gives many overlapping neighborhoods.

So:

```text
small stride
→ more kernel positions
→ more output pixels
```

## Stride = 2

The kernel moves two pixels at a time.

```text
Position 1

[ K K K ] . .
[ K K K ] . .
[ K K K ] . .

        ↓ move 2 pixels

. . [ K K K ]
. . [ K K K ]
. . [ K K K ]
```

This skips some possible kernel positions.

So:

```text
large stride
→ fewer kernel positions
→ fewer output pixels
```

Example:

For a `5×5` image with a `3×3` kernel:

```text
stride = 1
→ output size = 3×3
```

With:

```text
stride = 2
→ output size = 2×2
```

With no [[Padding|padding]] and no kernel dilation, the output-size formula along one dimension is:

$$
O=  
\left\lfloor  
\frac{N-K}{S}  
\right\rfloor+1  
$$

where:

```text
N = input size
K = kernel size
S = stride
O = output size
```

Apply the formula separately to height and width. These examples keep the image and kernel sizes fixed while changing only the stride.

For the formula with padding included, see [[Filtering Geometry|filtering geometry]].

Example:

```text
N = 5
K = 3
S = 2
```

$$
O=  
\left\lfloor  
\frac{5-3}{2}  
\right\rfloor+1  
=2  
$$

So:

```text
5×5 input
3×3 kernel
stride 2

→ 2×2 output
```

For normal image filtering, stride is usually:

```text
1
```

because we normally want to process every possible neighboring position.
