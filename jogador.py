import pygame
from config import LARGURA, ALTURA, COR_CIANO, COR_BRANCO, criar_sprite


class BolaDeFogo(pygame.sprite.Sprite):
    def __init__(self, x, y, vx=0, vy=-9):
        super().__init__()
        self.image = pygame.Surface((8, 14))
        self.image.fill(COR_CIANO)
        pygame.draw.rect(self.image, COR_BRANCO, (2, 2, 4, 10))
        self.rect = self.image.get_rect(center=(x, y))
        self.vx = vx
        self.vy = vy

    def update(self):
        self.rect.x += self.vx
        self.rect.y += self.vy
        if self.rect.bottom < 0:
            self.kill()


class Jogador(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.sprites = [criar_sprite("dragao_a", 4), criar_sprite("dragao_b", 4)]
        self.frame = 0
        self.image = self.sprites[0]
        self.rect = self.image.get_rect(center=(LARGURA // 2, ALTURA - 65))

        self.velocidade = 5
        self.vidas = 3
        self.nivel_fogo = 1
        self.cooldown = 0
        self.invulneravel = 0

    def resetar_posicao(self):
        self.rect.center = (LARGURA // 2, ALTURA - 65)

    def update(self):
        teclas = pygame.key.get_pressed()
        if teclas[pygame.K_LEFT] or teclas[pygame.K_a]:
            self.rect.x -= self.velocidade
        if teclas[pygame.K_RIGHT] or teclas[pygame.K_d]:
            self.rect.x += self.velocidade

        self.rect.left = max(10, self.rect.left)
        self.rect.right = min(LARGURA - 10, self.rect.right)

        if self.cooldown > 0:
            self.cooldown -= 1
        if self.invulneravel > 0:
            self.invulneravel -= 1

        # Animação das asas
        self.frame += 1
        idx = (self.frame // 12) % 2
        self.image = self.sprites[idx].copy()

        # Pisca quando invulnerável
        if self.invulneravel > 0 and (self.invulneravel // 5) % 2 == 0:
            self.image.set_alpha(80)

    def atirar(self, grupo_tiros, som_tiro):
        if self.cooldown > 0:
            return
        self.cooldown = 16
        som_tiro.play()

        if self.nivel_fogo == 1:
            grupo_tiros.add(BolaDeFogo(self.rect.centerx, self.rect.top))
        else:
            grupo_tiros.add(BolaDeFogo(self.rect.left + 8, self.rect.top + 6, vx=-0.6))
            grupo_tiros.add(BolaDeFogo(self.rect.right - 8, self.rect.top + 6, vx=0.6))

    def sofrer_dano(self, som_dano):
        if self.invulneravel > 0:
            return False
        self.vidas -= 1
        self.nivel_fogo = 1
        self.invulneravel = 100
        som_dano.play()
        return True