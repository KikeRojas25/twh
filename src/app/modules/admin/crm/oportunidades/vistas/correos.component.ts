import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { CrmService } from '../../../_services/crm.service';
import { BandejaCorreo, EstadoCorreo, OportunidadCard } from '../../crm.types';

/**
 * Vista "Correos" (Fase 3): conectar Gmail del vendedor, ver la bandeja con match
 * de remitentes contra el CRM, y vincular un correo a una oportunidad.
 */
@Component({
  selector: 'app-crm-correos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TooltipModule],
  templateUrl: './correos.component.html',
})
export class CorreosComponent implements OnInit, OnChanges {
  @Input() cards: OportunidadCard[] = [];

  estado: EstadoCorreo | null = null;
  cargandoEstado = false;
  bandeja: BandejaCorreo[] = [];
  cargandoBandeja = false;
  conectando = false;
  vinculandoId: string | null = null;

  seleccion: Record<string, number | null> = {};
  private oportsPorEntidad = new Map<number, { label: string; value: number }[]>();
  todasOpciones: { label: string; value: number }[] = [];

  constructor(private crmService: CrmService, private messageService: MessageService) {}

  ngOnInit(): void { this.cargarEstado(); }
  ngOnChanges(): void { this.recomputarOpciones(); }

  private recomputarOpciones(): void {
    this.oportsPorEntidad.clear();
    this.todasOpciones = [];
    for (const c of this.cards ?? []) {
      const opt = { label: c.nombre, value: c.oportunidadId };
      this.todasOpciones.push(opt);
      const arr = this.oportsPorEntidad.get(c.entidadId) ?? [];
      arr.push(opt);
      this.oportsPorEntidad.set(c.entidadId, arr);
    }
  }

  opcionesPara(correo: BandejaCorreo): { label: string; value: number }[] {
    if (correo.conocido && correo.entidadId) {
      const arr = this.oportsPorEntidad.get(correo.entidadId);
      if (arr && arr.length) return arr;
    }
    return this.todasOpciones;
  }

  cargarEstado(): void {
    this.cargandoEstado = true;
    this.crmService.gmailEstado().subscribe({
      next: (e) => {
        this.estado = e;
        this.cargandoEstado = false;
        if (e?.conectado) this.cargarBandeja();
      },
      error: () => { this.estado = { conectado: false }; this.cargandoEstado = false; },
    });
  }

  cargarBandeja(): void {
    this.cargandoBandeja = true;
    this.crmService.gmailBandeja().subscribe({
      next: (b) => { this.bandeja = b ?? []; this.cargandoBandeja = false; },
      error: () => { this.bandeja = []; this.cargandoBandeja = false; },
    });
  }

  conectar(): void {
    this.conectando = true;
    this.crmService.gmailConnectUrl().subscribe({
      next: (res) => {
        this.conectando = false;
        const url = res?.url;
        if (!url) { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la conexión.' }); return; }
        const popup = window.open(url, 'gmail_oauth', 'width=520,height=660');
        const handler = (ev: MessageEvent) => {
          if (ev.data === 'gmail-conectado') {
            window.removeEventListener('message', handler);
            setTimeout(() => this.cargarEstado(), 600);
          }
        };
        window.addEventListener('message', handler);
        const timer = setInterval(() => {
          if (!popup || popup.closed) { clearInterval(timer); window.removeEventListener('message', handler); this.cargarEstado(); }
        }, 1200);
      },
      error: (err) => {
        this.conectando = false;
        this.messageService.add({ severity: 'error', summary: 'Gmail', detail: err?.error?.message || 'La integración de correo no está configurada en el servidor.' });
      },
    });
  }

  desconectar(): void {
    this.crmService.gmailDesconectar().subscribe({
      next: () => { this.estado = { conectado: false }; this.bandeja = []; this.messageService.add({ severity: 'success', summary: 'Gmail', detail: 'Cuenta desconectada.' }); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desconectar.' }),
    });
  }

  vincular(correo: BandejaCorreo): void {
    const oportunidadId = this.seleccion[correo.messageId];
    if (!oportunidadId) { this.messageService.add({ severity: 'warn', summary: 'Selecciona', detail: 'Elige una oportunidad para vincular.' }); return; }
    this.vinculandoId = correo.messageId;
    this.crmService.gmailVincular({ messageId: correo.messageId, oportunidadId }).subscribe({
      next: (res) => {
        this.vinculandoId = null;
        if (res && res.success === false) { this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: res.message }); return; }
        correo.yaVinculado = true;
        this.messageService.add({ severity: 'success', summary: 'Vinculado', detail: 'Correo registrado como comunicación.' });
      },
      error: (err) => { this.vinculandoId = null; this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo vincular.' }); },
    });
  }

  iniciales(nombre?: string | null): string {
    if (!nombre) return '?';
    const p = nombre.trim().split(/\s+/);
    return (((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()) || '?';
  }
}
