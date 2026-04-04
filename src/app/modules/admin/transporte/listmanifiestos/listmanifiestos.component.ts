import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TransporteService } from '../transporte.service';
import { ManifiestoResult } from '../transporte.types';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-listmanifiestos',
  templateUrl: './listmanifiestos.component.html',
  styleUrls: ['./listmanifiestos.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    ButtonModule,
    DropdownModule,
    TableModule,
    InputTextModule,
    CalendarModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class ListmanifiestosComponent implements OnInit {

  @ViewChild('resultadosBlock') resultadosBlock!: ElementRef;

  loading = false;
  manifiestos: ManifiestoResult[] = [];
  manifiestosFiltrados: ManifiestoResult[] = [];

  remitentes: SelectItem[] = [];
  estados: SelectItem[] = [
    { label: 'Todos',       value: undefined },
    { label: 'Programado',  value: 5 },
    { label: 'En ruta',     value: 8 },
    { label: 'Finalizado',  value: 12 },
  ];

  get estadosModal(): SelectItem[] {
    return this.estados.filter(e => e.value !== undefined);
  }

  model: any = {};
  dateInicio: Date = new Date();
  dateFin: Date = new Date();
  filtroGeneral = '';

  cols = [
    { field: 'acciones',           header: 'ACCIONES',       width: '160px' },
    { field: 'numero_manifiesto',  header: 'MANIFIESTO',     width: '140px' },
    { field: 'shipment',           header: 'SHIPMENT',       width: '120px' },
    { field: 'estado',             header: 'ESTADO',         width: '120px' },
    { field: 'Placa',              header: 'PLACA',          width: '90px' },
    { field: 'Chofer',             header: 'CHOFER',         width: '160px' },
    { field: 'valorizado',         header: 'VALORIZADO',     width: '100px' },
    { field: 'sobreestadia_tarifa',header: 'SOBREESTADÍA',   width: '110px' },
    { field: 'adicionales_tarifa', header: 'ADICIONALES',    width: '110px' },
    { field: 'fecha_salida',       header: 'F. SALIDA',      width: '100px' },
    { field: 'fecha_registro',     header: 'F. REGISTRO',    width: '100px' },
   
  ];

  // Modal cambio de estado
  displayCambioEstado = false;
  manifiestoSeleccionado: ManifiestoResult | null = null;
  nuevoEstadoId: number | null = null;
  guardando = false;

  // Modal detalle de órdenes
  displayDetalle = false;
  ordenesDetalle: any[] = [];
  cargandoDetalle = false;

  // Modal editar tarifas
  displayEditarTarifas = false;
  editTarifas = { valorizado: 0, adicionales_tarifa: 0, sobreestadia_tarifa: 0 };
  guardandoTarifas = false;

  es: any;

  constructor(
    private transporteService: TransporteService,
    private propietarioService: PropietarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.configurarCalendario();
    this.cargarRemitentes();
  }

  configurarCalendario(): void {
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],
      dayNamesShort: ['dom','lun','mar','mié','jue','vie','sáb'],
      dayNamesMin: ['D','L','M','X','J','V','S'],
      monthNames: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
      monthNamesShort: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],
      today: 'Hoy',
      clear: 'Borrar'
    };
  }

  cargarRemitentes(): void {
    this.propietarioService.getAllPropietarios().subscribe(resp => {
      this.remitentes = [
        { label: 'Todos', value: undefined },
        ...resp.map(p => ({ label: p.razonSocial.toUpperCase(), value: String(p.id) }))
      ];
    });
  }

  buscar(): void {
    this.loading = true;
    const remitente_id = this.model.remitente_id ? String(this.model.remitente_id) : '';
    this.transporteService.listarManifiestos(
      remitente_id,
      this.formatearFecha(this.dateInicio),
      this.formatearFecha(this.dateFin),
      this.model.numero_manifiesto
    ).subscribe({
      next: (resp) => {
        this.manifiestos = resp;
        this.aplicarFiltro();
        this.loading = false;
        setTimeout(() => this.resultadosBlock?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los manifiestos.' });
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroGeneral.trim()) {
      this.manifiestosFiltrados = [...this.manifiestos];
    } else {
      const f = this.filtroGeneral.toLowerCase();
      this.manifiestosFiltrados = this.manifiestos.filter(m =>
        (m.numero_manifiesto || '').toLowerCase().includes(f) ||
        (m.Placa || '').toLowerCase().includes(f) ||
        (m.Chofer || '').toLowerCase().includes(f) ||
        (m.estado || '').toLowerCase().includes(f) ||
        (m.shipment || '').toLowerCase().includes(f)
      );
    }
  }

  onFiltroChange(): void { this.aplicarFiltro(); }

  limpiarFiltros(): void {
    this.model = {};
    this.dateInicio = new Date();
    this.dateFin = new Date();
    this.filtroGeneral = '';
    this.manifiestos = [];
    this.manifiestosFiltrados = [];
  }

  // --- Cambio de estado ---

  abrirEditarTarifas(manifiesto: ManifiestoResult): void {
    this.manifiestoSeleccionado = { ...manifiesto };
    this.editTarifas = {
      valorizado: manifiesto.valorizado ?? 0,
      adicionales_tarifa: manifiesto.adicionales_tarifa ?? 0,
      sobreestadia_tarifa: manifiesto.sobreestadia_tarifa ?? 0
    };
    this.displayEditarTarifas = true;
  }

  guardarTarifas(): void {
    if (!this.manifiestoSeleccionado) return;
    this.guardandoTarifas = true;
    this.transporteService.actualizarTarifas(this.manifiestoSeleccionado.id, this.editTarifas).subscribe({
      next: () => {
        const idx = this.manifiestos.findIndex(m => m.id === this.manifiestoSeleccionado!.id);
        if (idx >= 0) {
          this.manifiestos[idx].valorizado = this.editTarifas.valorizado;
          this.manifiestos[idx].adicionales_tarifa = this.editTarifas.adicionales_tarifa;
          this.manifiestos[idx].sobreestadia_tarifa = this.editTarifas.sobreestadia_tarifa;
          this.aplicarFiltro();
        }
        this.displayEditarTarifas = false;
        this.guardandoTarifas = false;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Tarifas guardadas correctamente.' });
      },
      error: (err) => {
        this.guardandoTarifas = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo guardar.' });
      }
    });
  }

  abrirDetalle(manifiesto: ManifiestoResult): void {
    this.manifiestoSeleccionado = manifiesto;
    this.ordenesDetalle = [];
    this.cargandoDetalle = true;
    this.displayDetalle = true;
    this.transporteService.listarOrdenesPorManifiesto(manifiesto.id).subscribe({
      next: (resp) => {
        this.ordenesDetalle = resp;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle del manifiesto.' });
      }
    });
  }

  abrirCambioEstado(manifiesto: ManifiestoResult): void {
    this.manifiestoSeleccionado = { ...manifiesto };
    this.nuevoEstadoId = manifiesto.estado_id ?? null;
    this.displayCambioEstado = true;
  }

  confirmarCambioEstado(): void {
    if (!this.manifiestoSeleccionado || this.nuevoEstadoId == null) return;
    const estadoLabel = this.estados.find(e => e.value === this.nuevoEstadoId)?.label ?? this.nuevoEstadoId;
    this.confirmationService.confirm({
      message: `¿Cambiar el estado del manifiesto <strong>${this.manifiestoSeleccionado.numero_manifiesto}</strong> a <strong>${estadoLabel}</strong>?`,
      header: 'Confirmar cambio de estado',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.ejecutarCambioEstado()
    });
  }

  private ejecutarCambioEstado(): void {
    this.guardando = true;
    this.transporteService.cambiarEstadoManifiesto(this.manifiestoSeleccionado!.id, this.nuevoEstadoId!).subscribe({
      next: () => {
        // Actualizar la fila en la tabla sin recargar
        const idx = this.manifiestos.findIndex(m => m.id === this.manifiestoSeleccionado!.id);
        if (idx >= 0) {
          this.manifiestos[idx].estado_id = this.nuevoEstadoId!;
          this.manifiestos[idx].estado = this.estados.find(e => e.value === this.nuevoEstadoId)?.label ?? '';
          this.aplicarFiltro();
        }
        this.displayCambioEstado = false;
        this.guardando = false;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado cambiado correctamente.' });
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo cambiar el estado.' });
      }
    });
  }

  getEstadoBadgeClass(estadoId: number): string {
    const map: Record<number, string> = {
      5:  'bg-blue-100 text-blue-800',
      8:  'bg-yellow-100 text-yellow-800',
      12: 'bg-green-100 text-green-800',
    };
    return `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[estadoId] ?? 'bg-gray-100 text-gray-600'}`;
  }

  formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
