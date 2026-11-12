import sys
import math
import random
import pygame
from config import (
    LARGURA,
    ALTURA,
    FPS,
    TITULO,
    COR_FUNDO,
    COR_MAR,
    COR_OURO,
    COR_LARANJA,
    COR_CIANO,
    COR_VERMELHO,
    COR_BRANCO,
    MAPA_FASES,
    criar_sprite,
    gerar_som,
)
from jogador import Jogador
from inimigos import Inimigo, ChefaoDragao, PowerUp


class Jogo:
    def __init__(self):
        pygame.mixer.pre_init(22050, -16, 1, 512)
        pygame.init()
        self.tela = pygame.display.set_mode((LARGURA, ALTURA))
        pygame.display.set_caption(TITULO)
        self.clock = pygame.time.Clock()

        self.fonte_grande = pygame.font.SysFont("Courier New", 30, bold=True)
        self.fonte_media = pygame.font.SysFont("Courier New", 20, bold=True)
        self.fonte_pequena = pygame.font.SysFont("Courier New", 15, bold=True)

        # Sons sintetizados
        self.som_fogo = gerar_som(520, 180, 110, 0.2, "square")
        self.som_explosao = gerar_som(180, 45, 220, 0.3, "square")
        self.som_hit = gerar_som(240, 110, 80, 0.2, "sine")
        self.som_powerup = gerar_som(440, 880, 180, 0.25, "sine")
        self.som_dano = gerar_som(160, 40, 300, 0.35, "square")
        self.som_chefao = gerar_som(110, 45, 600, 0.4, "square")

        self.sprite_coracao = criar_sprite("coracao", 3)
        self.sprites_dragao_mapa = [
            criar_sprite("dragao_a", 4),
            criar_sprite("dragao_b", 4),
        ]

        # Brasas de fundo
        self.brasas = [
            [random.randint(0, LARGURA), random.randint(0, ALTURA), random.uniform(1, 3)]
            for _ in range(45)
        ]

        self.estado = "TITULO"  # TITULO, MAPA, JOGANDO, PAUSADO, GAMEOVER, VITORIA
        self.pontos = 0
        self.recorde = 0
        self.fase = 1
        self.frame = 0

        self.cursor_mapa = [MAPA_FASES[0]["x"], MAPA_FASES[0]["y"], True]

        self.jogador = Jogador()
        self.grupo_jogador = pygame.sprite.GroupSingle(self.jogador)
        self.tiros_jogador = pygame.sprite.Group()
        self.tiros_inimigos = pygame.sprite.Group()
        self.inimigos = pygame.sprite.Group()
        self.powerups = pygame.sprite.Group()
        self.chefao = pygame.sprite.GroupSingle()

    def novo_jogo(self):
        self.pontos = 0
        self.fase = 1
        self.jogador = Jogador()
        self.grupo_jogador.add(self.jogador)
        self.abrir_mapa(1)

    def abrir_mapa(self, proxima_fase):
        self.fase = proxima_fase
        self.estado = "MAPA"
        anterior = MAPA_FASES[max(0, proxima_fase - 2)]
        self.cursor_mapa = [float(anterior["x"]), float(anterior["y"]), proxima_fase == 1]

    def iniciar_fase(self, num):
        self.fase = num
        self.estado = "JOGANDO"
        self.tiros_jogador.empty()
        self.tiros_inimigos.empty()
        self.inimigos.empty()
        self.powerups.empty()
        self.chefao.empty()
        self.jogador.resetar_posicao()

        if num == 1:
            for linha in range(3):
                for col in range(6):
                    tipo = "wyvern" if linha == 0 else "morcego"
                    self.inimigos.add(Inimigo(45 + col * 66, 85 + linha * 48, tipo))
        elif num == 2:
            for i in range(6):
                self.inimigos.add(Inimigo(40 + i * 70, 75 + (i % 2) * 45, "wyvern"))
            for i in range(7):
                self.inimigos.add(
                    Inimigo(random.randint(30, LARGURA - 60), -50 - i * 85, "rocha")
                )
        elif num == 3:
            self.som_chefao.play()
            self.chefao.add(ChefaoDragao())

    def desenhar_texto_centro(self, texto, y, fonte, cor=COR_BRANCO):
        surf = fonte.render(texto, True, cor)
        rect = surf.get_rect(center=(LARGURA // 2, y))
        self.tela.blit(surf, rect)

    def desenhar_mapa(self):
        self.tela.fill(COR_MAR)

        # Ilhas em pixel art
        pygame.draw.rect(self.tela, (212, 163, 115), (45, 430, 145, 85))
        pygame.draw.rect(self.tela, (46, 125, 50), (55, 438, 125, 68))

        pygame.draw.rect(self.tela, (93, 64, 55), (260, 280, 160, 95))
        pygame.draw.rect(self.tela, (62, 39, 35), (300, 255, 80, 35))
        pygame.draw.rect(self.tela, COR_LARANJA, (324, 255, 32, 10))

        pygame.draw.rect(self.tela, (55, 71, 79), (115, 110, 165, 95))
        pygame.draw.rect(self.tela, (33, 33, 33), (155, 88, 85, 38))
        pygame.draw.rect(self.tela, COR_VERMELHO, (190, 98, 14, 14))

        # Trilha pontilhada entre as ilhas
        for i in range(len(MAPA_FASES) - 1):
            a, b = MAPA_FASES[i], MAPA_FASES[i + 1]
            for passo in range(1, 10):
                px = a["x"] + (b["x"] - a["x"]) * (passo / 10)
                py = a["y"] + (b["y"] - a["y"]) * (passo / 10)
                pygame.draw.rect(self.tela, COR_OURO, (px - 3, py - 3, 6, 6))

        # Marcadores das fases
        for no in MAPA_FASES:
            cor_no = (
                (0, 230, 118)
                if no["fase"] < self.fase
                else COR_OURO
                if no["fase"] == self.fase
                else (120, 144, 156)
            )
            pygame.draw.rect(self.tela, cor_no, (no["x"] - 14, no["y"] - 14, 28, 28))
            pygame.draw.rect(self.tela, COR_BRANCO, (no["x"] - 14, no["y"] - 14, 28, 28), 2)
            num_surf = self.fonte_pequena.render(str(no["fase"]), True, COR_BRANCO)
            self.tela.blit(num_surf, num_surf.get_rect(center=(no["x"], no["y"])))

        # Dragão voando no mapa
        spr = self.sprites_dragao_mapa[(self.frame // 14) % 2]
        self.tela.blit(spr, spr.get_rect(center=(self.cursor_mapa[0], self.cursor_mapa[1] - 24)))

        # Painéis do mapa
        pygame.draw.rect(self.tela, COR_FUNDO, (0, 0, LARGURA, 56))
        self.desenhar_texto_centro("MAPA DOS REINOS", 28, self.fonte_media, COR_LARANJA)

        pygame.draw.rect(self.tela, COR_FUNDO, (0, ALTURA - 90, LARGURA, 90))
        atual = MAPA_FASES[self.fase - 1]
        self.desenhar_texto_centro(
            f"FASE {self.fase}: {atual['nome']}", ALTURA - 58, self.fonte_media, COR_OURO
        )
        if self.cursor_mapa[2] and (self.frame // 20) % 2 == 0:
            self.desenhar_texto_centro(
                "APERTE ESPACO OU ENTER", ALTURA - 24, self.fonte_pequena, COR_CIANO
            )

    def desenhar_hud(self):
        txt_pontos = self.fonte_pequena.render(
            f"OURO: {self.pontos:05d}", True, COR_LARANJA
        )
        txt_recorde = self.fonte_pequena.render(
            f"RECORDE: {self.recorde:05d}", True, COR_OURO
        )
        txt_fase = self.fonte_pequena.render(
            f"REINO {self.fase}/3", True, (188, 170, 164)
        )

        self.tela.blit(txt_pontos, (12, 12))
        self.tela.blit(txt_recorde, (LARGURA - txt_recorde.get_width() - 12, 12))
        self.tela.blit(txt_fase, (LARGURA - txt_fase.get_width() - 12, 34))

        for i in range(self.jogador.vidas):
            self.tela.blit(self.sprite_coracao, (12 + i * 26, 34))

        # Barra de vida do Chefão
        if self.chefao.sprite:
            boss = self.chefao.sprite
            barra_w = 280
            barra_x = (LARGURA - barra_w) // 2
            pygame.draw.rect(self.tela, (40, 10, 10), (barra_x, 58, barra_w, 12))
            vida_w = int(barra_w * max(0, boss.hp / boss.max_hp))
            pygame.draw.rect(self.tela, COR_VERMELHO, (barra_x, 58, vida_w, 12))
            pygame.draw.rect(self.tela, COR_LARANJA, (barra_x, 58, barra_w, 12), 2)

    def atualizar_jogo(self):
        self.grupo_jogador.update()
        self.tiros_jogador.update()
        self.tiros_inimigos.update()
        self.powerups.update()

        teclas = pygame.key.get_pressed()
        if teclas[pygame.K_SPACE] or teclas[pygame.K_z] or teclas[pygame.K_UP]:
            self.jogador.atirar(self.tiros_jogador, self.som_fogo)

        # Movimento em formação dos inimigos
        bater_borda = False
        for inimigo in self.inimigos:
            inimigo.update(self.tiros_inimigos)
            if inimigo.tipo != "rocha":
                if inimigo.rect.left <= 14 or inimigo.rect.right >= LARGURA - 14:
                    bater_borda = True
                if inimigo.rect.bottom >= self.jogador.rect.top:
                    self.jogador.vidas = 0
                    self.estado = "GAMEOVER"

        if bater_borda:
            for inimigo in self.inimigos:
                if inimigo.tipo != "rocha":
                    inimigo.vx *= -1
                    inimigo.rect.y += 16

        # Chefão
        if self.chefao.sprite:
            self.chefao.sprite.update(self.tiros_inimigos, self.som_fogo)

        # Colisão: Tiros do Jogador x Inimigos
        acertos = pygame.sprite.groupcollide(self.inimigos, self.tiros_jogador, False, True)
        for inimigo, _ in acertos.items():
            inimigo.hp -= 1
            if inimigo.hp <= 0:
                self.som_explosao.play()
                self.pontos += inimigo.pontos
                self.recorde = max(self.recorde, self.pontos)
                if random.random() < 0.16:
                    self.powerups.add(PowerUp(inimigo.rect.centerx, inimigo.rect.centery))
                inimigo.kill()
            else:
                self.som_hit.play()

        # Colisão: Tiros do Jogador x Chefão
        if self.chefao.sprite:
            boss = self.chefao.sprite
            hits_boss = pygame.sprite.spritecollide(boss, self.tiros_jogador, True)
            for _ in hits_boss:
                boss.hp -= 1
                boss.flash = 4
                self.som_hit.play()
                if boss.hp <= 0:
                    self.som_chefao.play()
                    self.pontos += 3000
                    self.recorde = max(self.recorde, self.pontos)
                    boss.kill()
                    self.estado = "VITORIA"
                    return

        # Colisão: Power-ups x Jogador
        pegou_orb = pygame.sprite.spritecollide(self.jogador, self.powerups, True)
        for _ in pegou_orb:
            self.som_powerup.play()
            self.pontos += 250
            if self.jogador.nivel_fogo < 2:
                self.jogador.nivel_fogo = 2
            elif self.jogador.vidas < 5:
                self.jogador.vidas += 1

        # Colisão: Tiros/Inimigos x Jogador
        atingido = pygame.sprite.spritecollide(self.jogador, self.tiros_inimigos, True) or (
            pygame.sprite.spritecollide(self.jogador, self.inimigos, False)
        )
        if atingido:
            if self.jogador.sofrer_dano(self.som_dano) and self.jogador.vidas <= 0:
                self.estado = "GAMEOVER"

        # Avançar para o próximo ponto do mapa ao derrotar todos os inimigos
        if len(self.inimigos) == 0 and not self.chefao.sprite and self.estado == "JOGANDO":
            if self.fase < 3:
                self.abrir_mapa(self.fase + 1)

    def executar(self):
        while True:
            self.frame += 1
            for evento in pygame.event.get():
                if evento.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

                if evento.type == pygame.KEYDOWN:
                    if evento.key == pygame.K_p and self.estado in ("JOGANDO", "PAUSADO"):
                        self.estado = "PAUSADO" if self.estado == "JOGANDO" else "JOGANDO"

                    if evento.key in (pygame.K_RETURN, pygame.K_SPACE):
                        if self.estado in ("TITULO", "GAMEOVER", "VITORIA"):
                            self.novo_jogo()
                        elif self.estado == "MAPA" and self.cursor_mapa[2]:
                            self.iniciar_fase(self.fase)

            # Atualizar brasas
            for brasa in self.brasas:
                brasa[1] += brasa[2]
                if brasa[1] > ALTURA:
                    brasa[1] = 0
                    brasa[0] = random.randint(0, LARGURA)

            if self.estado == "MAPA":
                alvo = MAPA_FASES[self.fase - 1]
                dx = alvo["x"] - self.cursor_mapa[0]
                dy = alvo["y"] - self.cursor_mapa[1]
                dist = math.hypot(dx, dy)
                if dist > 3:
                    self.cursor_mapa[0] += (dx / dist) * 3.0
                    self.cursor_mapa[1] += (dy / dist) * 3.0
                else:
                    self.cursor_mapa = [float(alvo["x"]), float(alvo["y"]), True]

                self.desenhar_mapa()

            elif self.estado == "TITULO":
                self.tela.fill(COR_FUNDO)
                for b in self.brasas:
                    pygame.draw.rect(self.tela, COR_LARANJA, (b[0], b[1], 3, 3))
                self.desenhar_texto_centro("DRAGON PIXEL QUEST", 170, self.fonte_grande, COR_LARANJA)
                spr = self.sprites_dragao_mapa[(self.frame // 14) % 2]
                self.tela.blit(spr, spr.get_rect(center=(LARGURA // 2, 275)))
                self.desenhar_texto_centro("SETAS / WASD: VOAR", 370, self.fonte_pequena)
                self.desenhar_texto_centro("ESPACO: CUSPIR FOGO | P: PAUSA", 398, self.fonte_pequena)
                if (self.frame // 25) % 2 == 0:
                    self.desenhar_texto_centro("APERTE ENTER PARA INICIAR", 485, self.fonte_media, COR_OURO)

            elif self.estado in ("JOGANDO", "PAUSADO"):
                if self.estado == "JOGANDO":
                    self.atualizar_jogo()

                self.tela.fill(COR_FUNDO)
                for b in self.brasas:
                    pygame.draw.rect(self.tela, COR_LARANJA, (b[0], b[1], 3, 3))

                self.grupo_jogador.draw(self.tela)
                self.tiros_jogador.draw(self.tela)
                self.tiros_inimigos.draw(self.tela)
                self.inimigos.draw(self.tela)
                self.chefao.draw(self.tela)
                self.powerups.draw(self.tela)
                self.desenhar_hud()

                if self.estado == "PAUSADO":
                    self.desenhar_texto_centro("JOGO PAUSADO", ALTURA // 2, self.fonte_grande, COR_OURO)

            elif self.estado == "GAMEOVER":
                self.tela.fill(COR_FUNDO)
                self.desenhar_texto_centro("FIM DA JORNADA", 240, self.fonte_grande, COR_VERMELHO)
                self.desenhar_texto_centro(f"OURO COLETADO: {self.pontos}", 300, self.fonte_media)
                self.desenhar_texto_centro("APERTE ENTER PARA REINICIAR", 380, self.fonte_pequena, COR_LARANJA)

            elif self.estado == "VITORIA":
                self.tela.fill(COR_FUNDO)
                self.desenhar_texto_centro("LENDA DOS DRAGOES!", 230, self.fonte_grande, COR_OURO)
                self.desenhar_texto_centro(f"OURO FINAL: {self.pontos}", 295, self.fonte_media, COR_LARANJA)
                self.desenhar_texto_centro("APERTE ENTER PARA JOGAR DE NOVO", 380, self.fonte_pequena)

            pygame.display.flip()
            self.clock.tick(FPS)


if __name__ == "__main__":
    Jogo().executar()