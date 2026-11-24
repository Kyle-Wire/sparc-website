from PIL import Image, ImageDraw, ImageFont, ImageFilter
import pathlib, os
os.chdir(pathlib.Path(__file__).resolve().parent.parent)
P='preview/'
F=lambda s,w='SemiBold': ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{w}.otf',s)
M=lambda s: ImageFont.truetype('/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf',s)
W,H=3000,2350; bg=Image.new('RGB',(W,H),'#e9e7e1'); d=ImageDraw.Draw(bg)
mk=Image.open('src/mark-preview.png').convert('RGB').resize((150,150),Image.LANCZOS); bg.paste(mk,(110,90))
d.text((290,105),'Street kit · SPARC Labs',font=F(84),fill='#141414')
for i,c in enumerate(['#0b6a88','#cc331f','#7a4f12','#3f6b4e']): d.rounded_rectangle((295+i*95,215,375+i*95,229),5,fill=c)
d.text((120,270),'Every QR opens the free block record on sparclabs.co, tagged so each placement can be counted. Print once the product is live.',font=F(32,'Regular'),fill='#555')
def put(pos,name,box,label,size):
    im=Image.open(P+name+'.png').convert('RGB'); im.thumbnail(box,Image.LANCZOS); x,y=pos
    sh=Image.new('RGBA',(im.width+40,im.height+40),(0,0,0,0)); ImageDraw.Draw(sh).rectangle((20,24,im.width+20,im.height+24),fill=(0,0,0,70))
    sh=sh.filter(ImageFilter.GaussianBlur(10)); bg.paste(sh,(x-20,y-20),sh); bg.paste(im,(x,y))
    d.text((x,y+im.height+18),label,font=F(30),fill='#141414'); d.text((x,y+im.height+58),size,font=M(24),fill='#666')
for a in [((120,360),'01-flyer-letter',(1000,1300),'Flyer with tear-off tabs','8.5 × 11 in · prints at home or a shop'),
 ((1200,360),'05-booth-sign-18x24',(560,750),'Booth sign','18 × 24 in · foam board'),
 ((1830,360),'06-bus-shelter-47x68',(520,750),'Bus shelter (later)','47 × 68 in · standard shelter'),
 ((2420,360),'03-sticker-circle-3in',(460,460),'Circle sticker','3 in · die cut'),
 ((2420,960),'03-sticker-qr-3in',(460,460),'QR sticker','3 in square'),
 ((1200,1260),'02-card-front',(560,340),'Business card, front','3.5 × 2 in'),
 ((1830,1260),'02-card-back',(560,340),'Business card, back','QR to the block record'),
 ((1200,1760),'04-qr-card-front',(560,380),'Handout card, front','4 × 6 in · the backyard story'),
 ((1830,1760),'04-qr-card-back',(560,380),'Handout card, back','QR · free block record'),
 ((2420,1560),'03-sticker-bumper-6x2',(460,200),'Bumper sticker','6 × 2 in')]: put(*a)
bg.save('00-kit-overview.png')
