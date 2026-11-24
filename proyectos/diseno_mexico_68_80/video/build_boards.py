#!/usr/bin/env python3
"""Genera storyboard_src.json: un tablero de collage por capítulo + tarjetas de capítulo + cierre.
Coordenadas en un lienzo de 6000x3500. Zonas de cámara (centro, a zoom 1 se ve 1920x1080):
  A(1000,640)  B(3000,640)  C(5000,640)
  D(1000,1790) E(3000,1790) F(5000,1790)
  G(1000,2940) H(3000,2940) I(5000,2940)
Las anclas "@frase" se resuelven contra la transcripción con resolve_storyboard.py.
Para poner una foto real: agrega src="img/archivo.jpg" al elemento (y el archivo en remotion/public/img)."""
import json

ZONAS = {"A": (1000, 640), "B": (3000, 640), "C": (5000, 640), "D": (1000, 1790), "E": (3000, 1790), "F": (5000, 1790),
         "G": (1000, 2940), "H": (3000, 2940), "I": (5000, 2940)}

class Tablero:
    def __init__(s): s.items = []; s.cams = []; s.z = 1
    def _add(s, zona, d, x, y, **kw):
        cx, cy = ZONAS[zona]; d.update(x=cx - 960 + x, y=cy - 540 + y); d.update({k: v for k, v in kw.items() if v is not None})
        s.items.append(d); return d
    def cam(s, at, zona, z=1.0, dx=0, dy=0, dur=None):
        cx, cy = ZONAS[zona]; c = dict(at=at, x=cx + dx, y=cy + dy, z=z)
        if dur: c["dur"] = dur
        s.cams.append(c)
    def paper(s, zona, x, y, w, h, variant="page", rot=0, at=None, page=None, z=0):
        return s._add(zona, dict(type="paper", w=w, h=h, variant=variant, rot=rot, z=z), x, y, at=at, page=page)
    def tape(s, zona, x, y, w=220, rot=0, at=None):
        return s._add(zona, dict(type="tape", w=w, h=60, rot=rot, z=8), x, y, at=at)
    def photo(s, zona, x, y, w, h, label=None, src=None, at=None, rot=0, tag=None, bw=False, cutout=False, fit=None, z=3, frm=None):
        return s._add(zona, dict(type="photo", w=w, h=h, rot=rot, z=z, bw=bw, cutout=cutout), x, y, label=label, src=src, at=at, tag=tag, fit=fit, **({"from": frm} if frm else {}))
    def hand(s, zona, x, y, text, at=None, size=90, rot=0, color=None, font=None, underline=None):
        return s._add(zona, dict(type="hand", text=text, size=size, rot=rot, z=9), x, y, at=at, color=color, font=font, underline=underline)
    def arrow(s, zona, x, y, w, h, d, head=None, at=None, color=None):
        return s._add(zona, dict(type="arrow", w=w, h=h, d=d, z=9), x, y, head=head, at=at, color=color)
    def circle(s, zona, x, y, w, h, at=None, color=None):
        return s._add(zona, dict(type="circle", w=w, h=h, z=9), x, y, at=at, color=color)
    def ast(s, zona, x, y, w=90, at=None, color=None):
        return s._add(zona, dict(type="asterisk", w=w, z=9), x, y, at=at, color=color)
    def label(s, zona, x, y, text, at=None, size=64, rot=0, font=None, bg=None):
        return s._add(zona, dict(type="label", text=text, size=size, rot=rot, z=7), x, y, at=at, font=font, bg=bg)
    def tag(s, zona, x, y, text="ARCHIVO", at=None, rot=0):
        return s._add(zona, dict(type="tag", text=text, rot=rot, z=6), x, y, at=at)
    def ficha(s, zona, x, y, title, sub=None, year=None, at=None, rot=0, color=None, w=None):
        return s._add(zona, dict(type="ficha", title=title, rot=rot, z=7), x, y, sub=sub, year=year, at=at, color=color, w=w)
    def rotulo(s, zona, x, y, text, at=None, size=200, color=None, bg=None, rot=0):
        return s._add(zona, dict(type="rotulo", text=text, size=size, rot=rot, z=5), x, y, at=at, color=color, bg=bg)
    def opart(s, zona, x, y, w, h, color=None, bg=None, rot=0, at=None, z=1):
        return s._add(zona, dict(type="opart", w=w, h=h, rot=rot, z=z), x, y, color=color, bg=bg, at=at)
    def pictos(s, zona, x, y, items, w=900, size=230, at=None):
        return s._add(zona, dict(type="pictos", items=items, w=w, size=size, z=6), x, y, at=at)
    def year(s, zona, x, y, text, at=None, size=400, color=None, rot=0):
        return s._add(zona, dict(type="year", text=text, size=size, rot=rot, z=5), x, y, at=at, color=color)
    def embed(s, zona, x, y, scene, at, w=1700, props=None, **kw):
        return s._add(zona, dict(type="embed", scene=scene, w=w, z=kw.pop("z", 4)), x, y, at=at, props=props or {}, **kw)

ROSA, CIAN, VERDE, AMBAR, NARANJA = "#E4007C", "#009FDA", "#7AB800", "#F7A600", "#F26B1D"
FLECHA_DER = ("M10 40 C 120 0, 250 10, 330 90", "M290 60 L332 92 L285 110")
FLECHA_ABAJO = ("M40 10 C 10 120, 40 220, 120 280", "M80 250 L122 282 L78 300")
FLECHA_IZQ = ("M330 40 C 220 0, 90 20, 12 100", "M50 70 L10 102 L58 118")

scenes = []

# ============================== 1 · INTRODUCCIÓN (Marco) ==============================
t = Tablero()
t.opart("A", -120, -80, 1100, 760, color=ROSA, rot=0, z=0)
t.paper("A", 240, 150, 1300, 820, "kraft", rot=-2)
t.tape("A", 300, 130, rot=-12); t.tape("A", 1380, 140, rot=10)
t.rotulo("A", 320, 260, "QUIÉN\nDISEÑÓ", at="@Alguna vez", size=150, color="#1A1714")
t.label("A", 330, 700, "el **México moderno**?", at="@México moderno", size=96, font="display")
t.hand("A", 1180, 230, "¿?", at="@pensar", size=170, rot=12)
t.ast("A", 1460, 820, at="@México moderno")
t.tag("A", 280, 190, "PREGUNTA")
# B · logotipos que hoy vemos a diario
t.paper("B", 120, 120, 1650, 900, "page", rot=1, page=302)
t.photo("B", 180, 170, 760, 230, "México 68", src="img/mexico68_emblema.png", fit="contain", at="@Entre finales", rot=-4)
t.photo("B", 1180, 150, 380, 380, "Metro", src="img/metro_logo.png", fit="contain", at="@los años", rot=6)
t.photo("B", 1350, 560, 300, 400, "IMSS", src="img/imss_logo.png", fit="contain", at="@la década", rot=-5)
t.photo("B", 160, 560, 500, 303, "Televisa, 1973", src="img/st/televisa.png", cutout=True, at="@de los 80", rot=3)
t.photo("B", 640, 380, 640, 456, "Vista aérea de la Ciudad de México, 1962", src="img/st/aerea_cdmx_1962.png", cutout=True, at="@diseño gráfico", rot=2)
t.tape("B", 860, 360, rot=-6, at="@diseño gráfico")
t.hand("B", 760, 860, "1968 → 1980", at="@salto gigante", size=96, rot=-3)
t.circle("B", 700, 830, 560, 150, at="@salto gigante")
# C · de adorno a lenguaje (y la crítica al poder)
t.paper("C", 80, 120, 980, 860, "grid", rot=-1)
t.label("C", 140, 230, "simple adorno editorial", at="@Dejó de ser", size=58)
t.arrow("C", 130, 250, 640, 60, "M0 30 C 200 20, 420 40, 640 26", at="@adorno editorial")
t.hand("C", 300, 360, "↓", at="@para convertirse", size=120)
t.label("C", 140, 520, "un **lenguaje visual**", at="@lenguaje visual", size=84, font="display")
t.photo("C", 1120, 90, 560, 780, "Libertad de expresión, 1968", src="img/cartel_libertad_expresion.jpg", at="@capaz de organizar", rot=4)
t.tape("C", 1300, 70, rot=8, at="@capaz de organizar")
t.hand("C", 1080, 880, "criticar al poder", at="@criticar", size=72, rot=-4)
t.arrow("C", 980, 700, 330, 200, *FLECHA_DER, at="@criticar")
# F · organizar ciudades / construir identidad
t.photo("F", 140, 120, 900, 595, "Metro de la Ciudad de México, 1969", src="img/st/metro_1969_b.png", cutout=True, at="@organizar", rot=-3)
t.label("F", 180, 760, "organizar **ciudades**", at="@organizar", size=70)
t.photo("F", 1150, 200, 520, 520, "IMSS", src="img/imss_logo.png", fit="contain", at="@construir", rot=5)
t.label("F", 1080, 760, "construir **identidad**", at="@construir", size=70)
t.ast("F", 1100, 120, at="@construir", color=ROSA)
# E · título
t.opart("E", -180, -120, 2280, 1320, color=ROSA, z=0)
t.paper("E", 230, 140, 1460, 800, "page", rot=-1, page=1)
t.rotulo("E", 330, 220, "LA ÉPOCA\nDE ORO", at="@Hoy", size=190, color="#1A1714")
t.label("E", 340, 690, "del diseño gráfico en **México**", at="@Hoy", size=74, bg=False)
t.rotulo("E", 1180, 790, "1968—1980", at="@Lucas", size=86, color=ROSA)
t.hand("E", 1250, 260, "Marco · Lucas · Clau", at="@Lucas", size=56, font="caveat", rot=-6)
# H · el recorrido
t.paper("H", -40, 60, 2000, 900, "kraft", rot=0.5)
t.hand("H", 40, 90, "el recorrido →", at="@se verá", size=80)
t.photo("H", 60, 260, 300, 410, "Cómics", src="img/portada_supermachos.jpg", at="@cómics", rot=-5)
t.photo("H", 400, 240, 320, 320, "Carteles", src="img/cartel_mexico68_opart.jpg", at="@carteles", rot=4)
t.photo("H", 760, 270, 330, 320, "Juegos Olímpicos", src="img/boleto_soccer.jpg", at="@olímpicos", rot=-3)
t.photo("H", 1130, 250, 300, 300, "Metro", src="img/metro_logo.png", fit="contain", at="@el metro", rot=5)
t.photo("H", 1460, 260, 380, 270, "Museo Nacional de Antropología", src="img/st/mna_1974.png", cutout=True, at="@los museos", rot=-4)
t.photo("H", 1180, 590, 520, 237, "Billete de la 4ª serie", src="img/st/billete_1000.png", cutout=True, at="@billetes", rot=3)
for i, (x, txt, a) in enumerate([(70, "cómics", "@cómics"), (430, "carteles", "@carteles"), (780, "olimpiadas", "@olímpicos"), (1150, "Metro", "@el metro"), (1500, "museos", "@los museos")]):
    t.hand("H", x, 700 if i < 4 else 560, txt, at=a, size=60, font="caveat", rot=(-1) ** i * 4)
t.cam("@Alguna vez", "A", 1.0)
t.cam("@Entre finales", "B", 1.0)
t.cam("@Dejó de ser", "C", 1.0)
t.cam("@organizar", "F", 1.0)
t.cam("@Hoy", "E", 0.95)
t.cam("@se verá", "H", 0.92)
scenes.append(dict(block="b1", start=-0.8, type="board", props=dict(items=t.items, cams=t.cams, era="1968–80", title="La época de oro del diseño gráfico en México", barAt="@Hoy")))

# ============================== 2 · HISTORIETA Y MONEROS (Lucas) ==============================
scenes.append(dict(block="b2", start=0, type="chapter", props=dict(num="01", title="La historieta crítica y los moneros", years="1970 – 1980", color="#E2231A")))
t = Tablero()
# A · la explosión de los 70
t.paper("A", 60, 80, 1700, 900, "page", rot=-1, page=298)
t.year("A", 120, 140, "1970s", at="@Arrancamos", size=250, color="#E2231A")
t.photo("A", 1040, 120, 420, 600, "Los Agachados de Rius", src="img/portada_agachados.jpg", at="@explosión", rot=5)
t.photo("A", 640, 470, 400, 540, "Los Supermachos, 1973", src="img/portada_supermachos.jpg", at="@auténtica", rot=-6)
t.tape("A", 1150, 100, rot=12, at="@explosión"); t.tape("A", 720, 450, rot=-10, at="@auténtica")
t.hand("A", 160, 560, "¡explosión!", at="@explosión", size=96, rot=-6)
t.tag("A", 90, 100, "ARCHIVO")
# B · La Familia Burrón
t.paper("B", 100, 100, 1700, 900, "kraft", rot=1)
t.photo("B", 140, 200, 800, 560, "La Familia Burrón", src="img/st/familia_burron_estanquillo.png", cutout=True, at="@Por un lado", rot=-4)
t.tag("B", 160, 780, "MUSEO DEL ESTANQUILLO · CDMX", at="@Familia Burrón")
t.photo("B", 1000, 150, 380, 620, "Borola Burrón", src="img/st/borola.png", cutout=True, at="@Gabriel Vargas", rot=3)
t.photo("B", 1420, 300, 330, 254, "Boleto conmemorativo del Metro (2015)", src="img/st/boleto_burron.png", cutout=True, at="@clásicos", rot=-6)
t.ficha("B", 1100, 680, "GABRIEL VARGAS", "historietista", "La Familia Burrón · 1948–2009", at="@Gabriel Vargas", color="#E2231A")
t.hand("B", 760, 120, "clásico popular", at="@clásicos", size=70, rot=-5)
t.arrow("B", 700, 220, 330, 150, *FLECHA_DER, at="@Gabriel Vargas")
# C · los moneros
t.paper("C", 60, 60, 1100, 960, "page", rot=1.5, page=302)
t.photo("C", 220, 150, 740, 740, "Rius", src="img/st/rius.png", cutout=True, at="@al mismo tiempo", rot=-2)
t.ficha("C", 1120, 300, "RIUS", "(Eduardo del Río)\n– Caricaturista", at="@crítica", color="#E2231A")
t.label("C", 600, 850, "Los llamados **“moneros”**", at="@moneros", size=70)
t.hand("C", 40, 260, "SÁTIRA", at="@súper crítica", size=96, rot=-8, underline=True)
t.arrow("C", 70, 380, 300, 260, "M10 10 C 60 140, 140 220, 260 240", "M222 214 L262 242 L215 262", at="@súper crítica")
t.circle("C", 1100, 260, 560, 300, at="@moneros")
t.ast("C", 1560, 120, at="@moneros")
# F · caricaturistas
t.paper("F", 40, 60, 1840, 960, "grid", rot=-0.5)
t.hand("F", 80, 90, "caricaturistas e ilustradores", at="@Caricaturistas", size=72)
for i, (nm, a) in enumerate([("Rius", "@Rius"), ("Abel Quezada", "@Abel"), ("Freyre", "@Freire"), ("Helioflores", "@Flores"), ("Naranjo", "@Naranjo"), ("Sergio Arau", "@Sergio Arau")]):
    x = 100 + (i % 3) * 590; y = 230 + (i // 3) * 380
    sr = {"Rius": "rius", "Abel Quezada": "abel_quezada", "Freyre": "freyre", "Sergio Arau": "sergio_arau", "Helioflores": "helioflores", "Naranjo": "naranjo"}.get(nm)
    t.photo("F", x, y, 260, 320, nm, tag="RETRATO", at=a, rot=(-1) ** i * 4, bw=not sr, **({"src": f"img/st/{sr}.png", "cutout": True} if sr else {}))
    t.hand("F", x + 280, y + 140, nm, at=a, size=58, font="caveat", rot=(-1) ** i * 3)
t.label("F", 1000, 860, "para cuestionar al **sistema**", at="@cuestionar", size=58)
# E · revistas
t.paper("E", 60, 100, 1800, 880, "kraft", rot=1)
for i, (nm, a) in enumerate([("La Garrapata", "@Garrapata"), ("El Mitote Ilustrado", "@Mitote"), ("Quecosaedro", "@Que Cosa"), ("SNIF", "@SNIF")]):
    sr = {"La Garrapata": "garrapata", "El Mitote Ilustrado": "mitote_ilustrado", "Quecosaedro": "quecosaedro", "SNIF": "snif"}.get(nm)
    if sr:
        t.photo("E", 120 + i * 430, 170 + (i % 2) * 60, 380, 520, nm, tag="PORTADA", at=a, rot=(-1) ** i * 5, src=f"img/st/{sr}.png", cutout=True)
    else:  # sin imagen confiable: el nombre escrito a mano
        t.hand("E", 120 + i * 430, 330, nm.replace(" ", "\n", 1), at=a, size=78, rot=-6)
t.label("E", 180, 820, "espacios de **resistencia** y opinión pública", at="@espacios", size=60)
# D · Círculo de Tlacuilos
t.paper("D", 140, 120, 1500, 820, "page", rot=-1.5, page=301)
t.year("D", 220, 200, "1970", at="@Incluso en", size=280, color=NARANJA)
t.ficha("D", 300, 640, "CÍRCULO DE TLACUILOS", "para revalorar la narrativa visual mexicana", at="@Círculo", color=NARANJA, w=900)
t.ast("D", 1350, 260, at="@Círculo", color="#E2231A")
# G · experimentación gráfica
t.opart("G", -120, -40, 900, 700, color="#E2231A", z=0)
t.paper("G", 300, 60, 1600, 960, "page", rot=1, page=297)
t.label("G", 340, 100, "mucha **experimentación gráfica**", at="@experimentación", size=62)
t.photo("G", 360, 230, 420, 564, "Fábulas Pánicas (página), Alejandro Jodorowsky", src="img/st/fabulas_panicas.png", cutout=True, at="@pánicas", rot=-4)
t.photo("G", 820, 230, 380, 510, "Alejandro Jodorowsky", src="img/st/jodorowsky.png", cutout=True, at="@Jodorowsky", rot=3)
t.photo("G", 1260, 220, 420, 555, "Profesor Planeta, 1974", src="img/st/profesor_planeta.png", cutout=True, at="@Profesor Planeta", rot=5)
t.hand("G", 840, 760, "psicodelia", at="@psicodelia", size=64, rot=-4)
t.hand("G", 1180, 830, "ciencia", at="@ciencia", size=64, rot=3)
t.hand("G", 1400, 760, "montajes", at="@montajes", size=64, rot=-3)
# I · cierre del capítulo
t.paper("I", 160, 200, 1500, 700, "yellow", rot=-1)
t.label("I", 240, 300, "el cómic dejó de ser algo infantil", at="@El cómic", size=58, bg=False)
t.arrow("I", 900, 320, 360, 60, "M0 30 C 120 20, 240 40, 360 26", at="@infantil")
t.label("I", 240, 520, "medio gráfico de **alto impacto**", at="@alto impacto", size=78, font="display")
t.ast("I", 1460, 260, at="@alto impacto")
t.cam("@Arrancamos", "A"); t.cam("@Por un lado", "B"); t.cam("@al mismo tiempo", "C"); t.cam("@Caricaturistas", "F")
t.cam("@Revistas", "E"); t.cam("@Incluso en", "D"); t.cam("@Y a la par", "G"); t.cam("@El cómic dejó", "I", 0.95)
scenes.append(dict(block="b2", at="@Arrancamos", type="board", props=dict(items=t.items, cams=t.cams, era="70s", title="La historieta crítica y los ‘moneros’")))

# ============================== 3 · MÉXICO 68 Y 70 (Marco + Lucas) ==============================
scenes.append(dict(block="b3", start=0, type="chapter", props=dict(num="02", title="Sistemas de identidad: México 68 y México 70", years="1968 – 1970", color=ROSA)))
t = Tablero()
# A · profesionalización
t.opart("A", -160, -100, 1300, 900, color=ROSA, z=0)
t.paper("A", 200, 140, 1500, 820, "kraft", rot=-1.5)
t.label("A", 260, 200, "la verdadera **profesionalización**", at="@profesionalización", size=64)
t.rotulo("A", 280, 360, "MEXICO68", at="@grandes sistemas", size=200, color="#1A1714", bg="#FBF8F1")
t.photo("A", 1220, 600, 360, 360, "Boleto México 68", src="img/boleto_track.jpg", at="@comunicación visual", rot=6)
t.tape("A", 1300, 580, rot=-8, at="@comunicación visual")
t.hand("A", 300, 700, "a escala internacional", at="@escala", size=66, rot=-3)
# B · 1968: sede olímpica
t.paper("B", 80, 80, 1760, 920, "page", rot=1, page=299)
t.year("B", 120, 140, "1968", at="@En 1968", size=270, color=ROSA)
t.photo("B", 1060, 150, 720, 462, "Estadio Olímpico Universitario, 1968", src="img/st/estadio_1968_a.png", cutout=True, at="@sede", rot=3)
t.label("B", 160, 620, "sede de los **Juegos Olímpicos**", at="@Juegos Olímpicos", size=64)
t.photo("B", 1080, 640, 330, 330, "Boleto México 68", src="img/boleto_soccer.jpg", at="@Juegos Olímpicos", rot=-5)
# C · el equipo
t.paper("C", 40, 40, 1840, 1000, "grid", rot=-0.5)
t.hand("C", 80, 70, "un programa de identidad monumental", at="@monumental", size=64)
for i, (nm, sub, a) in enumerate([("Pedro Ramírez Vázquez", "arquitecto", "@Ramírez Vázquez"), ("Eduardo Terrazas", "arquitecto y diseñador", "@Terrazas"), ("Beatrice Trueblood", "diseño editorial", "@Trublo"), ("Lance Wyman", "diseñador gráfico", "@Lance")]):
    x = 90 + i * 445
    sr = {"Pedro Ramírez Vázquez": "ramirez_vazquez", "Eduardo Terrazas": "terrazas", "Beatrice Trueblood": "trueblood", "Lance Wyman": "lance_wyman"}.get(nm)
    t.photo("C", x, 210, 380, 470, nm, tag="RETRATO", at=a, rot=(-1) ** i * 3, bw=not sr, **({"src": f"img/st/{sr}.png", "cutout": True} if sr else {}))
    t.hand("C", x, 700, nm.replace(" ", "\n", 1), at=a, size=54, font="caveat", rot=(-1) ** i * 2)
t.circle("C", 1400, 180, 470, 560, at="@Lance")
t.label("C", 300, 860, "+ decenas de **jóvenes dibujantes** · Universidad Iberoamericana", at="@jóvenes dibujantes", size=50)
# F · el logotipo: op art + arte huichol
t.opart("F", -200, -140, 2300, 1300, color=ROSA, z=0)
t.photo("F", 160, 110, 740, 720, "Cartel México 68", src="img/cartel_mexico68_opart.jpg", at="@El resultado", rot=-3)
t.tape("F", 400, 90, rot=6, at="@El resultado")
t.photo("F", 1050, 140, 760, 220, "Emblema México 68", src="img/mexico68_emblema.png", fit="contain", at="@famoso logotipo", rot=2)
t.label("F", 1060, 430, "**OP ART**", at="@Op Art", size=80, font="display")
t.hand("F", 1460, 440, "+", at="@estambre", size=120)
t.photo("F", 1120, 520, 420, 418, "Tabla de estambre huichol", src="img/st/huichol_cuadro.png", cutout=True, at="@estambre", rot=4)
t.label("F", 200, 880, "líneas que se expanden al **infinito**", at="@infinito", size=62)
# E · pictogramas
t.paper("E", 40, 60, 1840, 980, "kraft", rot=0.5)
t.label("E", 90, 100, "los **pictogramas deportivos**", at="@pictogramas", size=66)
t.pictos("E", 100, 260, [dict(name="figura", at="@figura humana")], w=300, size=240)
t.arrow("E", 120, 230, 260, 280, "M20 20 L240 260 M240 20 L20 260", at="@otras olimpiadas")
t.hand("E", 90, 540, "otras olimpiadas", at="@otras olimpiadas", size=50, font="caveat")
t.photo("E", 460, 230, 340, 340, "Boleto: ecuestre", src="img/boleto_horse.jpg", at="@esencia", rot=-4)
t.pictos("E", 860, 250, [dict(name="box", at="@guante"), dict(name="bici", at="@bicicleta"), dict(name="aro", at="@basquetbol")], w=900, size=250)
t.hand("E", 880, 560, "guante · bicicleta · aro", at="@basquetbol", size=56, font="caveat")
t.label("E", 460, 720, "la **esencia del objeto**, no la figura humana", at="@esencia", size=56)
t.hand("E", 520, 860, "¡sin necesidad de leer español!", at="@sin necesidad", size=66, rot=-2)
# D · Olimpiada Cultural
t.paper("D", 80, 80, 1760, 920, "page", rot=-1, page=299)
t.label("D", 140, 120, "la **Olimpiada Cultural** llenó la ciudad", at="@Olimpiada Cultural", size=60)
t.photo("D", 140, 250, 520, 515, "Programa Cultural de la XIX Olimpiada (Guanajuato)", src="img/st/cartel_olimpiada_cultural_guanajuato.png", cutout=True, at="@carteles", rot=-4)
t.photo("D", 700, 260, 300, 480, "Estampilla aérea México 68 · Wyman", src="img/st/estampilla_paloma_wyman.png", cutout=True, at="@estampillas", rot=5)
t.photo("D", 1180, 300, 420, 423, "Moneda de plata de $25, 1968", src="img/st/moneda_25.png", cutout=True, at="@moneda", rot=-3)
t.hand("D", 1200, 760, "25 pesos · plata", at="@moneda", size=58, font="caveat")
# H · México 70
t.opart("H", -100, -60, 1000, 800, color=NARANJA, z=0)
t.paper("H", 240, 100, 1560, 900, "kraft", rot=1)
t.year("H", 300, 160, "1970", at="@Dos años", size=260, color=NARANJA)
t.rotulo("H", 300, 520, "MEXICO70", at="@Mundial", size=150, color=ROSA, bg="#FBF8F1")
t.hand("H", 320, 760, "la misma lógica urbana", at="@lógica urbana", size=62, rot=-3)
t.photo("H", 1220, 140, 460, 590, "Juanito, mascota de México 70", src="img/st/juanito_cartel.png", cutout=True, at="@Juanito", rot=4)
t.ficha("H", 1150, 760, "JUANITO", "Juan González Martínez", "1970", at="@Juan González", color=NARANJA)
t.cam("@Pero la verdadera", "A"); t.cam("@En 1968", "B"); t.cam("@dirigido por", "C"); t.cam("@El resultado", "F")
t.cam("@Pero lo más revolucionario", "E"); t.cam("@Además", "D"); t.cam("@Dos años", "H", 0.95)
scenes.append(dict(block="b3", at="@la verdadera", type="board", props=dict(items=t.items, cams=t.cams, era="1968–70", title="México 68 y 70 · la revolución de los pictogramas")))

# ============================== 4 · METRO Y MUSEOGRAFÍA (Clau) ==============================
scenes.append(dict(block="b4", start=-0.2, type="chapter", props=dict(num="03", title="El Metro de la CDMX y la nueva museografía", years="1964 – 1977", color=NARANJA)))
t = Tablero()
# A · caos urbano + construcción
t.paper("A", 80, 80, 1760, 920, "page", rot=-1, page=300)
t.photo("A", 140, 140, 900, 590, "Obras del Metro en el Zócalo, 1969", src="img/st/obras_metro_zocalo.png", cutout=True, at="@caos urbano", rot=-2)
t.label("A", 160, 790, "resolver el **caos urbano**", at="@caos urbano", size=66)
t.year("A", 1100, 160, "1969", at="@inauguró", size=200, color=NARANJA)
t.photo("A", 1180, 520, 360, 360, "Metro", src="img/metro_logo.png", fit="contain", at="@transporte", rot=5)
# B · Wyman y la señalética
t.paper("B", 60, 60, 1800, 960, "grid", rot=1)
t.photo("B", 120, 140, 900, 580, "El Metro funcionando, septiembre de 1969", src="img/st/metro_1969_a.png", cutout=True, at="@transporte", rot=2)
t.photo("B", 1080, 140, 600, 484, "Lance Wyman", src="img/st/lance_wyman.png", cutout=True, at="@le encargó", rot=-4)
t.ficha("B", 1100, 700, "LANCE WYMAN", "toda la señalética del Metro", "1969", at="@Lance Wyman", color=NARANJA)
t.hand("B", 200, 820, "toda la señalética", at="@señal ética", size=70, rot=-3)
t.arrow("B", 820, 760, 330, 150, *FLECHA_DER, at="@Lance Wyman")
# C · la M
t.embed("C", 110, 40, "metroM", at="@famosa M", w=1700, props=dict(railsAt="@rieles", squareAt="@famosa", arrowAt="@guía la vista"))
# F · Gestalt
t.embed("F", 110, 40, "gestalt", at="@Siguiendo", w=1700, props=dict(text="Un símbolo único para cada estación", textAt="@símbolo único"))
# E · estaciones + red
t.embed("E", 110, 40, "stations", at="@como el", w=1700, props=dict(items=[dict(name="Chapultepec", kind="chapulin", at="@Chapultepec"), dict(name="Merced", kind="manzana", at="@Merced")], note="Reinterpretación ilustrativa de los íconos de L. Wyman"))
t.embed("D", 110, 40, "network", at="@Gracias a esto", w=1700, props=dict(text="Incluso quien no sabía leer podía moverse por toda la red", textAt="@no sabían leer"))
# G · Museo Nacional de Antropología
t.paper("G", 60, 60, 1820, 960, "page", rot=-1, page=301)
t.label("G", 120, 100, "esta visión didáctica revolucionó **los museos**", at="@museos", size=58)
t.year("G", 120, 220, "1964", at="@En septiembre", size=250, color=CIAN)
t.photo("G", 900, 200, 820, 580, "Museo Nacional de Antropología", src="img/st/mna_1974.png", cutout=True, at="@Museo Nacional", rot=3)
t.ficha("G", 140, 560, "PEDRO RAMÍREZ VÁZQUEZ", "coordinó el museo", "17 · IX · 1964", at="@coordinado", color=CIAN, w=700)
t.label("G", 160, 850, "de colección fría a **espectáculo didáctico**", at="@espectáculo", size=56)
t.arrow("G", 300, 840, 330, 60, "M0 34 C 90 20, 200 40, 320 26", at="@colección fría")
# I · MUCA y Aristos
t.paper("I", 60, 60, 1800, 960, "kraft", rot=1)
t.photo("I", 120, 140, 620, 417, "MUCA · Ciudad Universitaria (2025)", src="img/st/muca_expo.png", cutout=True, at="@MUCA", rot=-3)
t.embed("I", 100, 590, "museografia", at="@Aristos", w=700, z=3, props=dict(text="MUCA y Aristos: museografía moderna", textAt="@museografía moderna"))
t.photo("I", 1400, 90, 420, 306, "Inauguración de una exposición (archivo)", src="img/st/museo_inauguracion_bn.png", cutout=True, at="@Mientras tanto", rot=4)
t.photo("I", 1430, 560, 400, 286, "Sala de exposición (archivo)", src="img/st/museo_sala_bn.png", cutout=True, at="@sistematizaron", rot=-3)
t.embed("I", 860, 100, "cartelVestir", at="@Si los artistas", w=520, z=3, rot=3, sceneW=1000, sceneH=1464, props=dict(year="1977"))
t.hand("I", 1440, 420, "1977", at="@Si los artistas", size=110, rot=-8)
t.label("I", 640, 860, "carteles culturales de **vanguardia**", at="@vanguardia", size=52)
t.cam("@sistema de pictogramas", "A"); t.cam("@le encargó", "B"); t.cam("@famosa M", "C"); t.cam("@Siguiendo", "F")
t.cam("@como el", "E"); t.cam("@Gracias a esto", "D"); t.cam("@visión didáctica", "G"); t.cam("@Mientras tanto", "I")
scenes.append(dict(block="b4", at="@sistema de pictogramas", type="board", props=dict(items=t.items, cams=t.cams, era="1969–77", title="El Metro de la CDMX y la nueva museografía")))

# ============================== 5 · IDENTIDAD, BILLETES Y CIERRE (Marco + Clau) ==============================
scenes.append(dict(block="b5", start=0, type="chapter", props=dict(num="04", title="Identidad corporativa, billetes y cierre", years="1969 – 1980", color="#1B3B2F")))
t = Tablero()
# A · personalidad corporativa
t.paper("A", 100, 100, 1700, 880, "grid", rot=-1)
t.hand("A", 160, 150, "con todo este aprendizaje…", at="@aprendizaje", size=60, font="caveat", rot=-2)
t.photo("A", 1150, 150, 340, 206, "Televisa, 1973", src="img/st/televisa.png", cutout=True, at="@empresas", rot=4)
t.photo("A", 1450, 300, 280, 280, "Instituciones públicas", src="img/imss_logo.png", fit="contain", at="@instituciones", rot=-5)
t.hand("A", 1180, 470, "empresas privadas", at="@empresas", size=48, font="caveat", rot=3)
t.hand("A", 1400, 600, "instituciones públicas", at="@instituciones", size=48, font="caveat", rot=-3)
t.label("A", 160, 260, "ya no bastaba un escudito bonito", at="@no bastaba", size=60)
t.arrow("A", 700, 220, 420, 60, "M0 34 C 140 18, 280 44, 420 26", at="@escudito")
t.label("A", 160, 420, "**personalidad corporativa**", at="@personalidad", size=96, font="display")
t.ficha("A", 1080, 620, "JOAN COSTA", "teórico de la imagen corporativa", at="@Costa", color=CIAN)
t.ast("A", 1500, 160, at="@personalidad", color=ROSA)
# B · logotipos
t.paper("B", 40, 40, 1840, 1000, "page", rot=0.5, page=302)
t.hand("B", 80, 70, "logotipos de nuestro paisaje diario", at="@De esta etapa", size=62)
LOG = [("IMSS", "img/imss_logo.png", "@paisaje", "Jorge Canales Romo, ca. 1975"), ("SEP", "img/st/sep_logo.png", "@emblema", "Almeida · Gleason · Valdés, 1977"), ("IPN", "img/st/ipn_logo.png", "@Politécnico", "Instituto Politécnico Nacional"),
       ("Televisa", "img/st/televisa.png", "@Televisa", "1973"), ("UAM", "img/st/uam_logo.png", "@UAM", "1973"), ("Lotería Nacional", "img/st/loteria_logo.png", "@Lotería", "")]
for i, (nm, src, a, sub) in enumerate(LOG):
    x = 100 + (i % 3) * 590; y = 200 + (i // 3) * 400
    t.photo("B", x, y, 320, 300, nm, src=src, tag="LOGOTIPO", fit="contain", at=a, rot=(-1) ** i * 3, cutout=bool(src and "/st/" in src))
    t.hand("B", x + 340, y + 90, nm + ("\n" + sub if sub else ""), at=a, size=44, font="caveat", rot=(-1) ** i * 2)
t.circle("B", 60, 170, 420, 380, at="@Canales")
# C · fábrica de billetes
t.paper("C", 80, 80, 1760, 920, "kraft", rot=-1)
t.year("C", 140, 160, "1969", at="@en 1969", size=260, color=VERDE)
t.photo("C", 1000, 140, 760, 570, "Banco de México", src="img/st/banxico_edificio.png", cutout=True, at="@fábrica", rot=3)
t.label("C", 160, 640, "hasta **nuestros bolsillos**", at="@bolsillos", size=70)
# F · cuarta serie
t.paper("F", 40, 40, 1840, 1000, "page", rot=0.5, page=303)
t.label("F", 100, 80, "la **cuarta serie** · Reyes Santana y otros", at="@cuarta serie", size=56)
for i, (nm, a) in enumerate([("Sor Juana · $1000", "@Sor Juana"), ("Morelos · $20", "@Morelos"), ("Benito Juárez · $50", "@Juárez"), ("Carranza · $100", "@Carranza")]):
    bill = {"Sor Juana · $1000": "billete_1000", "Morelos · $20": "billete_20", "Benito Juárez · $50": "billete_50", "Carranza · $100": "billete_100"}[nm]
    t.photo("F", 160 + (i % 2) * 860, 200 + (i // 2) * 360, 640, 330, nm, src=f"img/st/{bill}.png", cutout=True, at=a, rot=(-1) ** i * 3)
# E · estampillas
t.paper("E", 160, 100, 1600, 880, "grid", rot=-1)
t.label("E", 220, 150, "las estampillas dan crédito a sus **diseñadores**", at="@crédito oficial", size=56)
t.circle("E", 260, 560, 520, 200, at="@Davidson")
t.photo("E", 900, 340, 600, 381, "Estampilla · Lance Wyman", src="img/st/estampilla_wyman.png", cutout=True, at="@propio", rot=4)
t.hand("E", 300, 820, "Rafael Davidson", at="@Davidson", size=60, font="caveat")
t.hand("E", 1000, 820, "Lance Wyman", at="@propio", size=60, font="caveat")
# H · conclusión
t.opart("H", -200, -160, 2320, 1360, color=ROSA, z=0)
t.paper("H", 200, 120, 1520, 840, "page", rot=1, page=1)
t.label("H", 260, 200, "no solo resolvió problemas visuales", at="@no solo", size=56, bg=False)
t.rotulo("H", 260, 340, "CONSTRUYÓ EL\nIMAGINARIO", at="@construyó", size=140, color="#1A1714")
t.label("H", 260, 760, "moderno **del país**", at="@moderno", size=70, bg=False)
# I · la próxima vez...
t.paper("I", 60, 60, 1800, 960, "kraft", rot=-0.5)
t.photo("I", 120, 160, 420, 420, "Metro", src="img/metro_logo.png", fit="contain", at="@Metro", rot=-4)
t.photo("I", 680, 160, 360, 480, "IMSS", src="img/imss_logo.png", fit="contain", at="@institución", rot=3)
t.photo("I", 1180, 220, 600, 376, "Un billete", src="img/st/billete_50.png", cutout=True, at="@billete", rot=-3)
t.hand("I", 150, 620, "el Metro", at="@Metro", size=60, font="caveat")
t.hand("I", 700, 680, "una institución", at="@institución", size=60, font="caveat")
t.hand("I", 1240, 540, "un billete", at="@billete", size=60, font="caveat")
t.label("I", 200, 820, "detrás hay una historia de **diseño mexicano**", at="@detrás", size=60)
t.cam("@Con todo este", "A"); t.cam("@De esta etapa", "B"); t.cam("@en 1969", "C"); t.cam("@la cuarta serie", "F")
t.cam("@Al mismo tiempo", "E"); t.cam("@En conclusión", "H", 0.95); t.cam("@La próxima vez", "I")
scenes.append(dict(block="b5", at="@Con todo este", type="board", props=dict(items=t.items, cams=t.cams, era="1969–80", title="Identidad corporativa, billetes y estampillas")))
scenes.append(dict(block="b5", at="@Muchas gracias", type="end", props=dict(credits=["Voces: Marco · Lucas · Clau", "Imágenes: Wikimedia Commons, Internet Archive, Library of Congress", "Referencia bibliográfica: [título del libro]"])))

# Imágenes reales -> versión sticker (recorte con delineado blanco) en img/st/*.png
import os
for sc in scenes:
    for it in sc["props"].get("items", []):
        src = it.get("src")
        if it.get("type") == "photo" and src and not src.startswith("img/st/"):
            st = "img/st/" + os.path.splitext(os.path.basename(src))[0] + ".png"
            if os.path.exists(os.path.join("remotion/public", st)):
                it["src"] = st; it["cutout"] = True

# ============================== IMÁGENES A PANTALLA COMPLETA ==============================
overlays = [
    dict(block="b1", at="@diseño gráfico", dur=3.6, props=dict(src="img/full/aerea_cdmx_1962.jpg", move="out", bw=True,
         ficha=dict(title="Ciudad de México, noviembre de 1962", sub="Archivo Histórico de la Ciudad de México"))),
    dict(block="b2", at="@Arrancamos", dur=3.6, props=dict(src="img/full/supermachos.jpg", fit="contain", move="in",
         ficha=dict(title="Los Supermachos, núm. 383 · Rius", sub="3 de mayo de 1973"))),
    dict(block="b2", at="@Familia Burrón", dur=3.4, props=dict(src="img/full/familia_burron.jpg", move="left",
         ficha=dict(title="La Familia Burrón · Gabriel Vargas", sub="Fachada del Museo del Estanquillo, CDMX"), nota=dict(text="¡clásico popular!", x=1180, y=120))),
    dict(block="b3", at="@sede", dur=3.4, props=dict(src="img/full/estadio_1968_a.jpg", move="right",
         ficha=dict(title="Ceremonia inaugural, 12 de octubre de 1968", sub="Estadio Olímpico Universitario"))),
    dict(block="b3", at="@estambre", dur=1.8, props=dict(src="img/full/huichol_cuadro.jpg", fit="contain", move="in",
         ficha=dict(title="Arte huichol (wixárika)", sub="cuadro de estambre"))),
    dict(block="b3", at="@Juanito", dur=3.0, props=dict(src="img/full/juanito.jpg", fit="contain", move="in",
         ficha=dict(title="Juanito, mascota de México 70", sub="diseño de Juan González Martínez · figura exhibida en 2012"))),
    dict(block="b4", at="@caos urbano", dur=3.0, props=dict(src="img/full/obras_metro_zocalo.jpg", move="out", bw=True,
         ficha=dict(title="Obras del Metro en el Zócalo, 1969", sub="Archivo Histórico de la Ciudad de México"))),
    dict(block="b4", at="@Distrito Federal", dur=3.2, props=dict(src="img/full/metro_1969_a.jpg", move="left", bw=True,
         ficha=dict(title="El Metro funcionando, 5 de septiembre de 1969", sub="Archivo Histórico de la Ciudad de México"))),
    dict(block="b4", at="@En septiembre", dur=3.4, props=dict(src="img/full/mna_1974.jpg", move="in",
         ficha=dict(title="Museo Nacional de Antropología", sub="inaugurado el 17 de septiembre de 1964"))),
    dict(block="b5", at="@fábrica", dur=3.0, props=dict(src="img/full/banxico_edificio.jpg", move="out",
         ficha=dict(title="Banco de México", sub="en 1969 abre su propia fábrica de billetes"))),
    dict(block="b3", at="@creando líneas", until="@revolucionario", props=dict(src="img/full/cartel_mexico68.jpg", fit="contain", move="in",
         ficha=dict(title="Cartel oficial de México 68", sub="Programa de identidad · Library of Congress"))),
]

# ============================== GOLPES DE PALABRA (estímulos breves) ==============================
G = lambda block, at, text, **kw: dict(block=block, at=at, dur=kw.pop("dur", 1.1), kind="golpe", props=dict(text=text, **kw))
overlays += [
    G("b1", "@lenguaje visual", "LENGUAJE\nVISUAL", font="op", color="#171412", fondo="#FBF8F1"),
    G("b2", "@moneros", "¡MONEROS!", font="comic", color="#FFE14D", fondo="#E2231A"),
    G("b2", "@alto impacto", "¡ALTO IMPACTO!", font="comic", color="#171412", fondo="#FFE14D"),
    G("b3", "@pictogramas", "PICTOGRAMAS", font="op", color="#FBF8F1", fondo="#E4007C"),
    G("b4", "@espectáculo", "¡ESPECTÁCULO\nDIDÁCTICO!", font="display", color="#FBF8F1", fondo="#009FDA"),
    G("b5", "@personalidad", "PERSONALIDAD\nCORPORATIVA", font="display", color="#171412", fondo="#FFE14D"),
    G("b5", "@bolsillos", "¡HASTA TU\nBOLSILLO!", font="display", color="#FBF8F1", fondo="#2E6B52"),
]

json.dump(dict(_doc=__doc__, scenes=scenes, overlays=overlays), open("storyboard_src.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(scenes), "escenas;", sum(len(s["props"].get("items", [])) for s in scenes), "piezas")
