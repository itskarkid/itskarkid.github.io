---
title: Convolution
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-25
lastTended: 2026-10-25
tags: [course-note, machine-vision, image-processing, convolution]
publish: true
---
**Convolution** is the process of applying a [[Kernel|kernel]] across an [[Image|image]] to calculate new pixel values.

> [!summary]- Mental Model
> ![[convulation.png]]

The basic flow is:

```text
Take kernel
   ↓
place it over an image region
   ↓
multiply corresponding values
   ↓
add the results
   ↓
produce one output pixel
   ↓
move kernel
   ↓
repeat
```

$$  
\begin{bmatrix}  
10&10&10\\  
10&100&10\\ 
10&10&10  
\end{bmatrix}  
$$

and the averaging kernel is:

$$
K=\frac{1}{9}  
\begin{bmatrix}  
1&1&1\\
1&1&1\\ 
1&1&1  
\end{bmatrix}  
$$

At one position:

```
IMAGE              KERNEL

10  10  10         1  1  1
10 100  10    ×    1  1  1
10  10  10         1  1  1
```

Multiply corresponding values:

```
10×1   10×1   10×1
10×1  100×1   10×1
10×1   10×1   10×1
```

Then add them:

$$
10+10+10+10+100+10+10+10+10=180  
$$

Because this kernel has the factor $\frac{1}{9}$

$$
180/9=20  
$$

So this kernel position produces:

```
one output value = 20
```

That value is placed at the output location corresponding to the current kernel position.

Then the kernel moves to the next position and repeats the calculation.

```
Position 1
[ K K K ] . .
[ K K K ] . .
[ K K K ] . .

        ↓ move

Position 2
. [ K K K ] .
. [ K K K ] .
. [ K K K ] .
```

So:

```
one kernel position
→ one calculation
→ one output pixel
```

and:

```
many kernel positions
→ many output pixels
→ filtered image
```

### Why the centre?

For an odd-sized kernel such as `3×3`, there is one clear centre.

Conceptually, the question is:

> What should the new value of the pixel under the kernel centre be, based on its neighbourhood?

So:

```
Neighbourhood
    ↓
kernel calculation
    ↓
new value for current position
```

The key distinction is:

```
Kernel = the matrix / rule

Convolution = the process of applying that rule across the image
```

The amount the kernel moves between positions is called the **[[Stride|stride]]**.