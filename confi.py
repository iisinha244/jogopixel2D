import math
import array
import pygame

# Dimensões e FPS
LARGURA = 480
ALTURA = 640
FPS = 60
TITULO = "DRAGON PIXEL QUEST - PYTHON"

# Paleta de Cores Retro
COR_FUNDO = (26, 11, 11)
COR_MAR = (13, 43, 69)
COR_OURO = (255, 214, 0)
COR_LARANJA = (255, 109, 0)
COR_CIANO = (0, 229, 255)
COR_VERMELHO = (213, 0, 0)
COR_VERDE = (46, 125, 50)
COR_BRANCO = (255, 255, 255)

PALETA_PIXEL = {
    '.': None,
    'W': (255, 255, 255),
    'C': (0, 229, 255),
    'B': (21, 101, 192),
    'R': (213, 0, 0),
    'M': (255, 82, 82),
    'O': (255, 109, 0),
    'Y': (255, 214, 0),
    'G': (46, 125, 50),
    'P': (106, 27, 154),
    'D': (78, 52, 46),
    'S': (141, 110, 99),
}

# Matrizes Pixel Art
SPRITES_MAPA = {
    "dragao_a": [
        ".....C.....",
        "....CYC....",
        "....CCC....",
        ".CC.BCB.CC.",
        "CCCBBCBBCCC",
        "CC.BBBB.CC.",
        "....BBB....",
        "....B.B....",
        ".....B.....",
    ],
    "dragao_b": [
        ".....C.....",
        "....CYC....",
        "....CCC....",
        "...CBCBC...",
        "..CCBBBCC..",
        ".CC.BBB.CC.",
        "....BBB....",
        "....B.B....",
        ".....B.....",
    ],
    "morcego_a": [
        "P.........P",
        "PP..PPP..PP",
        "PPPPPYPPPPP",
        ".PPPPPPPPP.",
        "..PP...PP..",
        "...........",
    ],
    "morcego_b": [
        "...........",
        "...PPPPP...",
        ".PPPPYPPPP.",
        "PP.PPPPP.PP",
        "P...P.P...P",
        "...........",
    ],
    "wyvern_a": [
        "G....G....G",
        "GG..GYG..GG",
        "GGGGGGGGGGG",
        ".GG.GGG.GG.",
        "....GGG....",
        "...G...G...",
    ],
    "wyvern_b": [
        ".....G.....",
        "...GGYGG...",
        ".GGGGGGGGG.",
        "GG..GGG..GG",
        "....GGG....",
        "...G...G...",
    ],
    "rocha": [
        "..DDDDD..",
        ".DSSODSD.",
        "DSODDDOSD",
        "DDDDODDDD",
        ".DSDDDSD.",
        "..DDDDD..",
    ],
    "coracao": [
        ".RR.RR.",
        "RRRRRRR",
        "RRRRRRR",
        ".RRRRR.",
        "..RRR..",
        "...R...",
    ],
    "orbe": [
        "..OOO..",
        ".OYYYO.",
        "OYWWWOY",
        "OYWWWOY",
        ".OYYYO.",
        "..OOO..",
    ],
    "chefao_a": [
        "Y........RR........Y",
        ".Y......RYYR......Y.",
        "RR.....RRRRRR.....RR",
        "RRR...RRMMMMRR...RRR",
        "RRRRRRRRMMMMRRRRRRRR",
        "RRRRR.RRRRRRRR.RRRRR",
        "RRR...RRRRRRRR...RRR",
        "R......RR..RR......R",
        ".......O....O.......",
    ],
    "chefao_b": [
        "Y........RR........Y",
        ".Y......RYYR......Y.",
        "........RRRR........",
        "......RRMMMMRR......",
        "...RRRRRMMMMRRRRR...",
        ".RRRR.RRRRRRRR.RRRR.",
        "RRR...RRRRRRRR...RRR",
        "R......RR..RR......R",
        ".......O....O.......",
    ],
}

# Pontos do Mapa Mundi
MAPA_FASES = [
    {"fase": 1, "nome": "ILHA DOS VENTOS", "x": 115, "y": 470},
    {"fase": 2, "nome": "MONTANHA DE MAGMA", "x": 340, "y": 325},
    {"fase": 3, "nome": "COVIL DO ANCESTRAL", "x": 195, "y": 165},
]


def criar_sprite(nome, escala=4):
    matriz = SPRITES_MAPA[nome]
    altura = len(matriz)
    largura = len(matriz[0])
    superficie = pygame.Surface((largura * escala, altura * escala), pygame.SRCALPHA)

    for y, linha in enumerate(matriz):
        for x, char in enumerate(linha):
            cor = PALETA_PIXEL.get(char)
            if cor:
                pygame.draw.rect(
                    superficie, cor, (x * escala, y * escala, escala, escala)
                )
    return superficie


def gerar_som(freq_inicio, freq_fim, duracao_ms, volume=0.25, onda="square"):
    """Gera efeitos sonoros 8-bit diretamente via código."""
    sample_rate = 22050
    n_samples = int(sample_rate * (duracao_ms / 1000.0))
    buf = array.array("h", [0] * n_samples)

    for i in range(n_samples):
        t = i / sample_rate
        progresso = i / max(1, n_samples)
        freq = freq_inicio + (freq_fim - freq_inicio) * progresso
        envelope = 1.0 - progresso

        if onda == "square":
            val = 1.0 if math.sin(2.0 * math.pi * freq * t) >= 0 else -1.0
        else:
            val = math.sin(2.0 * math.pi * freq * t)

        buf[i] = int(val * envelope * volume * 32767)

    return pygame.mixer.Sound(buffer=buf)