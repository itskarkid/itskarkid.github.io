---
title: Image
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-24
lastTended: 2026-10-24
tags:
  - course-note
  - machine-vision
  - image-processing
  - opencv
publish: true
---
An **image** is a matrix of number

> [!summary]- Mental Model
> ![[image_info.png]]

For a grayscale image:

```text
10   50   60
90   20   13
30  180  255
```

Every number is one pixel intensity:

```text
0   : Black
....
.... Shades of gray
....
255 : White
```

A grey scale image has shape:

```text
(rows, columns) or (height, width) // image.shape
```

## Image Coordinate

```text
(row, column) = (y, x)
```

So if you access:

```text
[10, 3]
```

That means:

```text
row    = y = 10
column = x = 3
```

not x = 10, y =3

For color images, each pixel has three channels:

```text
[R G B]
```

For example

```text
[255, 0, 0] => Red
[0, 255, 0] => Green
[0, 0, 255] => Blue
[255, 255, 255] => White
[0, 0, 0] => Black
```

A color image usually has shape:

```text
(height, width, 3) => (rows, columns, channels)
```

OpenCV often uses

```text
BGR instead of RGB
```

That is way we often use

```python
cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
```

when displaying OpenCV images with Matplotlib.

## Represent this image in Python

```python
import numpy as np

image = np.array([
    [0,   60, 120],
    [180, 240, 100],
    [150, 200, 255]
], dtype=np.uint8)

print(image)
print("Shape:", image.shape)
print("Data type:", image.dtype)
```

**Expected output:**

```
[[  0  60 120]
 [180 240 100]
 [150 200 255]]

Shape: (3, 3)
Data type: uint8
```

### Understanding pixel coordinates

![700](data:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(13%2C%2013%2C%2013\)%22%20viewBox%3D%220%200%20340%20218%22%20width%3D%22100%25%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20font-size%3D%2212%22%20fill%3D%22currentColor%22%20text-anchor%3D%22middle%22%3E%3Ctext%20x%3D%22105%22%20y%3D%2231%22%3E0%3C%2Ftext%3E%3Ctext%20x%3D%2249%22%20y%3D%2272%22%3E0%3C%2Ftext%3E%3Ctext%20x%3D%22170%22%20y%3D%2231%22%3E1%3C%2Ftext%3E%3Ctext%20x%3D%2249%22%20y%3D%22125%22%3E1%3C%2Ftext%3E%3Ctext%20x%3D%22235%22%20y%3D%2231%22%3E2%3C%2Ftext%3E%3Ctext%20x%3D%2249%22%20y%3D%22178%22%3E2%3C%2Ftext%3E%3C%2Fg%3E%3Ctext%20x%3D%22205%22%20y%3D%2213%22%20fill%3D%22currentColor%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%3EColumn%20\(x\)%20%E2%86%92%3C%2Ftext%3E%3Cg%20stroke%3D%22currentColor%22%20stroke-opacity%3D%22.4%22%3E%3Crect%20x%3D%2273%22%20y%3D%2241%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22138%22%20y%3D%2241%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22203%22%20y%3D%2241%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%2273%22%20y%3D%2294%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22138%22%20y%3D%2294%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22203%22%20y%3D%2294%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23087fa5%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%2273%22%20y%3D%22147%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22138%22%20y%3D%22147%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3Crect%20x%3D%22203%22%20y%3D%22147%22%20width%3D%2264%22%20height%3D%2252%22%20rx%3D%223%22%20fill%3D%22%23888888%22%20fill-opacity%3D%220.1%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22currentColor%22%20font-size%3D%2211%22%20text-anchor%3D%22middle%22%3E%3Ctext%20x%3D%22105%22%20y%3D%2272%22%3E%5B0%2C%200%5D%3C%2Ftext%3E%3Ctext%20x%3D%22170%22%20y%3D%2272%22%3E%5B0%2C%201%5D%3C%2Ftext%3E%3Ctext%20x%3D%22235%22%20y%3D%2272%22%3E%5B0%2C%202%5D%3C%2Ftext%3E%3Ctext%20x%3D%22105%22%20y%3D%22125%22%3E%5B1%2C%200%5D%3C%2Ftext%3E%3Ctext%20x%3D%22170%22%20y%3D%22125%22%3E%5B1%2C%201%5D%3C%2Ftext%3E%3Ctext%20x%3D%22235%22%20y%3D%22125%22%20fill%3D%22%23ffffff%22%3E100%3C%2Ftext%3E%3Ctext%20x%3D%22105%22%20y%3D%22178%22%3E%5B2%2C%200%5D%3C%2Ftext%3E%3Ctext%20x%3D%22170%22%20y%3D%22178%22%3E%5B2%2C%201%5D%3C%2Ftext%3E%3Ctext%20x%3D%22235%22%20y%3D%22178%22%3E%5B2%2C%202%5D%3C%2Ftext%3E%3C%2Fg%3E%3Ctext%20x%3D%22170%22%20y%3D%22209%22%20fill%3D%22currentColor%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%3EHighlighted%20pixel%3A%20image%5B1%2C%202%5D%3C%2Ftext%3E%3C%2Fsvg%3E)
The highlighted pixel has:

- NumPy index: `image[1, 2]`
- Image coordinate: `(x=2, y=1)`
- Pixel intensity: `100`

### Visualize an image with Matplotlib

```python
import matplotlib.pyplot as plt

plt.imshow(image, cmap="gray", vmin=0, vmax=255)
plt.title("My First Grayscale Image")
plt.colorbar(label="Pixel intensity")
plt.show()
```
`imshow()` displays your array as an image. The arguments `vmin=0` and `vmax=255` ensure that the grayscale mapping uses the full range.

## Color Images, RGB/BGR and OpenCV

A grayscale pixel stores one intensity value. A color pixel typically stores three values:

- R (Red) — intensity of red
- G (Green) — intensity of green
- B (Blue) — intensity of blue

### Grayscale versus color image arrays

**A Grey Scale has two dimensions** 
<p align="left"><center>(Height, Width)</center></p>
![[gray_parrot.png]]<center>Shape: (480, 640)</center>

**A Color Image has three dimensions** 

<p align="left"><center>(Height, Width, Channel)</center></p>
![[color_parrot.png]]<center>Shape: (480, 640, 3)</center>

