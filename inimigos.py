import random
import math
import pygame
from config import LARGURA, ALTURA, COR_LARANJA, COR_OURO, criar_sprite


class FogoInimigo(pygame.sprite.Sprite):
    def __init__(self, x, y, vx=0, vy=4.5):
        super().__init__()
        self.image = pygame.Surface((8, 12))
        self.image.fill(COR_LARANJA)
        pygame.draw.rect(self.image, COR_OURO, (2, 2, 4, 8))
        self.rect = self.image.get_rect(center=(x, y))
        self.vx = vx
        self.vy = vy

    def update(self):
        self.rect.x += self.vx
        self.rect.y += self.vy
        if self.rect.top > ALTURA or self.rect.right < 0 or self.rect.left > LARGURA:
            self.kill()


class PowerUp(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = criar_sprite("orbe", 4)
        self.rect = self.image.get_rect(center=(x, y))

    def update(self):
        self.rect.y += 2.5
        if self.rect.top > ALTURA:
            self.kill()


class Inimigo(pygame.sprite.Sprite):
    def __init__(self, x, y, tipo="morcego"):
        super().__init__()
        self.tipo = tipo
        self.frame = random.randint(0, 20)

        if tipo == "morcego":
            self.sprites = [criar_sprite("morcego_a", 4), criar_sprite("morcego_b", 4)]
            self.hp = 1
            self.pontos = 100
            self.vx = 1.6
            self.vy = 0
        elif tipo == "wyvern":
            self.sprites = [criar_sprite("wyvern_a", 4), criar_sprite("wyvern_b", 4)]
            self.hp = 2
            self.pontos = 200
            self.vx = 2.2
            self.vy = 0
        else:  # rocha vulcânica
            self.sprites = [criar_sprite("rocha", 4)]
            self.hp = 2
            self.pontos = 120
            self.vx = random.uniform(-1.0, 1.0)
            self.vy = random.uniform(2.2, 3.2)

        self.image = self.sprites[0]
        self.rect = self.image.get_rect(topleft=(x, y))

    def update(self, grupo_tiros_inimigos):
        self.frame += 1
        if len(self.sprites) > 1:
            self.image = self.sprites[(self.frame // 16) % 2]

        if self.tipo == "rocha":
            self.rect.x += self.vx
            self.rect.y += self.vy
            if self.rect.top > ALTURA:
                self.rect.y = -30
                self.rect.x = random.randint(20, LARGURA - 50)
        else:
            self.rect.x += self.vx
            if random.random() < 0.005:
                grupo_tiros_inimigos.add(FogoInimigo(self.rect.centerx, self.rect.bottom))


class ChefaoDragao(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.sprites = [criar_sprite("chefao_a", 7), criar_sprite("chefao_b", 7)]
        self.image = self.sprites[0]
        self.rect = self.image.get_rect(center=(LARGURA // 2, -80))

        self.hp = 75
        self.max_hp = 75
        self.vx = 2.4
        self.timer = 0
        self.flash = 0

    def update(self, grupo_tiros_inimigos, som_ataque):
        self.timer += 1
        base_img = self.sprites[(self.timer // 16) % 2].copy()

        if self.flash > 0:
            self.flash -= 1
            base_img.fill((255, 255, 255), special_flags=pygame.BLEND_RGB_ADD)

        self.image = base_img

        # Entrada dramática no topo da tela
        if self.rect.top < 75:
            self.rect.y += 2
            return

        self.rect.x += self.vx
        if self.rect.left <= 16 or self.rect.right >= LARGURA - 16:
            self.vx *= -1

        # Ataque triplo de bolas de fogo
        if self.timer % 55 == 0:
            som_ataque.play()
            for angulo in (-0.35, 0.0, 0.35):
                vx = math.sin(angulo) * 4.5
                vy = math.cos(angulo) * 4.8
                grupo_tiros_inimigos.add(
                    FogoInimigo(self.rect.centerx, self.rect.bottom - 10, vx, vy)
                )