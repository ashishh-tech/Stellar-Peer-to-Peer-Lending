import sys
from PIL import Image, ImageDraw, ImageFont
import os

try:
    with open('contracts/stellarlend/test_output.txt', 'r', encoding='utf-8') as f:
        text = f.read()
except UnicodeDecodeError:
    with open('contracts/stellarlend/test_output.txt', 'r', encoding='utf-16') as f:
        text = f.read()

lines = text.split('\n')
lines = lines[-25:]
text_to_draw = '\n'.join(lines)

font = ImageFont.load_default()
img = Image.new('RGB', (800, 400), color = (30, 30, 30))
d = ImageDraw.Draw(img)
d.text((10,10), text_to_draw, fill=(200,200,200), font=font)
if not os.path.exists('screenshots'):
    os.makedirs('screenshots')
img.save('screenshots/test_output.png')
print('Image saved successfully.')
