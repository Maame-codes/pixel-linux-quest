# Reference only: how intro-scene-1969.svg was drawn (Python + Pillow). Port the method to TypeScript; do not add Python to the project.
from PIL import Image
class Canvas:
    def __init__(s,w,h,bg=None):
        s.w,s.h=w,h; s.px=[[bg]*w for _ in range(h)]
    def rect(s,x,y,w,h,c):
        for yy in range(y,y+h):
            for xx in range(x,x+w):
                if 0<=xx<s.w and 0<=yy<s.h: s.px[yy][xx]=c
    def pix(s,x,y,c): s.rect(x,y,1,1,c)
    def sprite(s,x,y,rows,leg,flip=False):
        for j,r in enumerate(rows):
            if flip: r=r[::-1]
            for i,ch in enumerate(r):
                if ch in leg and leg[ch]: s.pix(x+i,y+j,leg[ch])
    def png(s,path,scale=8):
        im=Image.new('RGB',(s.w*scale,s.h*scale),(255,0,255))
        from PIL import ImageDraw
        d=ImageDraw.Draw(im)
        for y in range(s.h):
            for x in range(s.w):
                c=s.px[y][x]
                if c: d.rectangle([x*scale,y*scale,x*scale+scale-1,y*scale+scale-1],fill=c)
        im.save(path)
    def paths(s):
        # one <path> per colour, horizontal runs
        runs={}
        for y in range(s.h):
            x=0
            while x<s.w:
                c=s.px[y][x]
                if c is None: x+=1; continue
                st=x
                while x<s.w and s.px[y][x]==c: x+=1
                runs.setdefault(c,[]).append(f"M{st} {y}h{x-st}v1h-{x-st}z")
        return "".join(f'<path fill="{c}" d="{"".join(v)}"></path>' for c,v in runs.items())

DIG={'0':["###","#.#","#.#","#.#","###"],'1':[".#.","##.",".#.",".#.","###"],'6':["###","#..","###","#.#","###"],'9':["###","#.#","###","..#","###"]}
def text(cv,x,y,s,c):
    for ch in s:
        cv.sprite(x,y,DIG[ch],{'#':c}); x+=4

PIP=["......KKKK......","....KKKKKKKK....","...KKKKKKKKKK...","...KKWWKKWWKK...","..KKKWBKKWBKKK..","..KKKWWOOWWKKK..","..KKKKOOOOKKKK..",".KKKWWWWWWWWKKK.",".KKWWWWWWWWWWKK.","KKKWWWWWWWWWWKKK","KK.WWWWWWWWWW.KK","...WWWWWWWWWW...","...KWWWWWWWWK...","....KKWWWWKK....","...OOOO..OOOO..."]
PIPLEG={'K':'#0f1020','W':'#f4f4f4','B':'#0f1020','O':'#ef7d57'}

W,H=128,72
cv=Canvas(W,H)
DEEP='#0f1020'; BG='#1a1c2c'
# wall
cv.rect(0,0,W,50,'#333c57')
for x in range(0,W,16): cv.rect(x,0,1,47,'#2d3550')
cv.rect(0,46,W,4,BG)            # baseboard
# floor checker
for ty,y in enumerate(range(50,H,6)):
    for tx,x in enumerate(range(0,W,8)):
        cv.rect(x,y,8,6,'#566c86' if (tx+ty)%2==0 else '#4c607a')
cv.rect(0,50,W,1,'#94b0c2')
# window
cv.rect(3,6,23,20,DEEP); cv.rect(5,8,19,16,'#1d2440')
cv.rect(14,8,1,16,DEEP); cv.rect(5,15,19,1,DEEP)
for (x,y) in [(7,10),(11,12),(17,9),(21,11),(8,19),(19,21)]: cv.pix(x,y,'#f4f4f4')
cv.rect(18,17,3,3,'#ffcd75'); cv.pix(20,17,'#1d2440')
cv.rect(3,26,23,2,'#566c86')   # sill
# calendar
cv.pix(37,7,'#94b0c2')
cv.rect(28,9,19,16,DEEP); cv.rect(29,10,17,14,'#f4f4f4'); cv.rect(29,10,17,3,'#b13e53')
text(cv,30,14,'1969','#0f1020')
for yy in (20,22):
    for xx in range(31,45,2): cv.pix(xx,yy,'#94b0c2')
cv.pix(41,22,'#b13e53')
# computer bank: 3 cabinets
def cabinet(x):
    cv.rect(x,12,15,36,DEEP)
    cv.rect(x+1,13,13,34,'#94b0c2')
    cv.rect(x+1,13,13,1,'#f4f4f4')
    cv.rect(x+13,14,1,33,'#566c86')
for x in (53,67,81): cabinet(x)
cv.rect(53,47,43,1,DEEP)
# cab1: light panel + vents
cv.rect(55,16,10,12,BG)
cv.rect(55,31,10,1,DEEP)
for yy in range(18,28,2):
    for xx in range(56,64,2): cv.pix(xx,yy,'#333c57')
for yy in range(34,44,2): cv.rect(56,yy,8,1,'#566c86')
# cab2: tape reels
cv.rect(69,15,11,21,BG)
REEL=["..####..",".#oooo#.","#oo##oo#","#o#hh#o#","#o#hh#o#","#oo##oo#",".#oooo#.","..####.."]
for ry in (16,26):
    cv.sprite(70,ry,REEL,{'#':'#566c86','o':'#333c57','h':'#c5d2db'})
cv.rect(70,39,2,2,'#ef7d57'); cv.rect(74,39,2,2,'#ffcd75'); cv.rect(78,39,1,2,'#a7f070')
# cab3: scope + switches
cv.rect(83,16,10,9,DEEP); cv.rect(84,17,8,7,'#257179')
for i,yy in enumerate([20,19,18,19,20,21,22,21]): cv.pix(84+i,yy,'#a7f070')
for i in range(5): cv.rect(84+i*2,29,1,2,'#f4f4f4' if i%2 else '#0f1020')
for yy in range(34,44,2): cv.rect(84,yy,8,1,'#566c86')
# desk + teletype
WOOD='#8a5a44'; WOODD='#6b4433'
cv.rect(102,37,25,2,WOOD); cv.rect(102,39,25,1,WOODD)
cv.rect(104,40,2,10,WOODD); cv.rect(123,40,2,10,WOODD)
cv.rect(108,26,18,11,DEEP); cv.rect(109,27,16,9,'#d8c9a3'); cv.rect(109,33,16,3,'#b3a47e')
for xx in range(110,124,2): cv.pix(xx,34,'#566c86')
# paper
cv.rect(112,15,10,12,'#f4f4f4'); cv.rect(112,15,10,1,'#c5d2db')
for yy,w in [(17,7),(19,8),(21,5),(23,3)]: cv.rect(113,yy,w,1,'#566c86')
# stool
cv.rect(95,42,8,2,WOODD); cv.rect(96,44,1,6,WOODD); cv.rect(101,44,1,6,WOODD)
# people
SK='#e8b48a'; HR='#3b2a20'
STAND=["...hhhh....","..hhhhhh...","..hhssss...","..hsssess..","..hsssss...","...ssss....","....ss.....","..tttttt...",".tttttttss.",".tttttt....",".tttttt....",".stttttt...",".s.pppp....","...pppp....","...pp.pp...","...pp.pp...","...pp.pp...","...pp.pp...","...pp.pp...","..kkk.kkk.."]
cv.sprite(43,30,STAND,{'h':HR,'s':SK,'e':DEEP,'t':'#3b5dc9','p':'#1a1c2c','k':DEEP})
SIT=["...hhhh.....","..hhhhhh....","..hhssss....","..hsssess...","..hbbbbbb...","...bbbbb....","....bbb.....","..gggggg....",".gggggggggss",".gggggg.....",".gggggg.....",".pppppppp...",".pppppppp...","......pp....","......pp....","......pp....","......kkk..."]
cv.sprite(94,26,SIT,{'h':HR,'s':SK,'e':DEEP,'b':'#4a3326','g':'#38b764','p':'#29366f','k':DEEP})

over={}
def layer(name):
    c=Canvas(W,H); over[name]=c; return c
L=[ '#ef7d57','#ffcd75','#a7f070','#73eff7']
a=layer('lightsA'); b=layer('lightsB')
i=0
for yy in range(18,28,2):
    for xx in range(56,64,2):
        (a if (i*7)%3==0 else b).pix(xx,yy,L[i%4]); i+=1
r1=layer('reelA'); r2=layer('reelB')
for ry in (16,26):
    r1.rect(73,ry+1,2,1,'#c5d2db'); r1.rect(73,ry+6,2,1,'#c5d2db')
    r2.rect(71,ry+3,1,2,'#c5d2db'); r2.rect(76,ry+3,1,2,'#c5d2db')
sc=layer('scopeB'); sc.rect(84,17,8,7,'#257179')
for i,yy in enumerate([22,21,20,19,18,19,20,21]): sc.pix(84+i,yy,'#a7f070')
cu=layer('cursor'); cu.rect(117,23,1,1,'#0f1020')
st=layer('stars'); st.pix(17,9,'#1d2440'); st.pix(8,19,'#1d2440'); st.pix(11,12,'#94b0c2')
pp=layer('pip'); pp.sprite(6,55,PIP,PIPLEG)
full=Canvas(W,H)
for y in range(H):
    for x in range(W): full.px[y][x]=cv.px[y][x]
for n in ('lightsA','pip'):
    for y in range(H):
        for x in range(W):
            if over[n].px[y][x]: full.px[y][x]=over[n].px[y][x]
full.png('A.png')
import json
json.dump({'base':cv.paths(),'over':{k:v.paths() for k,v in over.items()}},open('A.json','w'))


