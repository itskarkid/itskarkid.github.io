---
title: Stride
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-26
lastTended: 2026-10-26
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

```
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

```
small stride
→ more kernel positions
→ more output pixels
```

## Stride = 2

The kernel moves two pixels at a time.

```
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

```
large stride
→ fewer kernel positions
→ fewer output pixels
```

Example:

For a `5×5` image with a `3×3` kernel:

```
stride = 1
→ output size = 3×3
```

With:

```
stride = 2
→ output size = 2×2
```

The output-size formula with no [[Padding|padding]] is:

$$
O=  
\left\lfloor  
\frac{N-K}{S}  
\right\rfloor+1  
$$

where:

```
N = input size
K = kernel size
S = stride
O = output size
```

Example:

```
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

```
5×5 input
3×3 kernel
stride 2

→ 2×2 output
```

For normal image filtering, stride is usually:

```
1
```

because we normally want to process every possible neighboring position.