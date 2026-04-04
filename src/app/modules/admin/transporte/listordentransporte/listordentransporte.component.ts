import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TransporteService } from '../transporte.service';
import { OrdenTransporteResult } from '../transporte.types';
import { GeneralService } from '../../_services/general.service';
import { PropietarioService } from '../../_services/propietario.service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-listordentransporte',
  templateUrl: './listordentransporte.component.html',
  styleUrls: ['./listordentransporte.component.css'],
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
    FileUploadModule,
    ToastModule,
    ProgressBarModule,
    TooltipModule
  ],
  providers: [MessageService]
})
export class ListordentransporteComponent implements OnInit {

  @ViewChild('resultadosBlock') resultadosBlock!: ElementRef;

  cols: any[] = [];
  loading = false;
  ordenesTransporte: OrdenTransporteResult[] = [];
  ordenesFiltradas: OrdenTransporteResult[] = [];

  remitentes: SelectItem[] = [];
  estados: SelectItem[] = [];
  model: any = {};

  dateInicio: Date = new Date();
  dateFin: Date = new Date();

  filtroGeneral: string = '';

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  usuarioId: number = 0;

  es: any;

  // Subir fotos
  displaySubirFoto = false;
  subiendoFoto = false;
  ordenSeleccionada: OrdenTransporteResult | null = null;
  archivoSeleccionado: File | null = null;
  errorArchivo: string = '';

  // Ver fotos
  displayVerFotos = false;
  fotosOrden: any[] = [];
  cargandoFotos = false;

  readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  readonly TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/jpg'];

  constructor(
    private transporteService: TransporteService,
    private generalService: GeneralService,
    private propietarioService: PropietarioService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.configurarCalendario();
    this.inicializarColumnas();
    this.cargarDatosIniciales();
  }

  configurarCalendario(): void {
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      today: 'Hoy',
      clear: 'Borrar'
    };
  }

  inicializarColumnas(): void {
    this.cols = [
      { header: 'ACCIONES', field: 'acciones', width: '90px' },
      { header: 'NÚMERO OT', field: 'numero_ot', width: '120px' },
      { header: 'NÚMERO MANIFIESTO', field: 'numero_manifiesto', width: '150px' },
      { header: 'ESTADO', field: 'Estado', width: '120px' },
      { header: 'PLACA', field: 'Placa', width: '100px' },
      { header: 'CHOFER', field: 'Chofer', width: '150px' },
      { header: 'SHIPMENT', field: 'shipment', width: '120px' },
      { header: 'DELIVERY', field: 'delivery', width: '120px' },
      { header: 'REMITENTE', field: 'remitente', width: '180px' },
      { header: 'DESTINATARIO', field: 'destinatario', width: '180px' },
      { header: 'FACTURA', field: 'factura', width: '120px' },
      { header: 'OC', field: 'oc', width: '120px' },
      { header: 'GUÍAS', field: 'guias', width: '120px' },
      { header: 'CANTIDAD', field: 'cantidad', width: '100px' },
      { header: 'VOLUMEN', field: 'volumen', width: '100px' },
      { header: 'PESO', field: 'peso', width: '100px' },
      { header: 'DISTRITO SERVICIO', field: 'distrito_servicio', width: '150px' },
      { header: 'DIRECCIÓN DESTINO', field: 'direccion_destino_servicio', width: '200px' },
      { header: 'FECHA SALIDA', field: 'fecha_salida', width: '120px' },
      { header: 'HORA SALIDA', field: 'hora_salida', width: '100px' },
      { header: 'DIRECCIÓN ENTREGA', field: 'direccion_entrega', width: '200px' },
      { header: 'PROVINCIA ENTREGA', field: 'provincia_entrega', width: '150px' },
      { header: 'FECHA ENTREGA', field: 'fecha_entrega', width: '120px' },
      { header: 'HORA ENTREGA', field: 'hora_entrega', width: '100px' },
      { header: 'POR ASIGNAR', field: 'por_asignar', width: '100px' }
    ];
  }

  cargarDatosIniciales(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.decodedToken = this.jwtHelper.decodeToken(token);
      this.usuarioId = parseInt(this.decodedToken.nameid || '0');
    }

    this.propietarioService.getAllPropietarios().subscribe(resp => {
      this.remitentes.push({ label: 'Todos', value: undefined });
      resp.forEach(element => {
        this.remitentes.push({
          label: element.razonSocial.toUpperCase(),
          value: element.id
        });
      });
    });

    this.generalService.getAll(3).subscribe(resp => {
      this.estados.push({ label: 'Todos', value: undefined });
      resp.forEach(element => {
        this.estados.push({
          value: element.id,
          label: element.nombreEstado
        });
      });
    });
  }

  buscar(): void {
    this.loading = true;

    const fec_ini = this.dateInicio ? this.formatearFecha(this.dateInicio) : '';
    const fec_fin = this.dateFin ? this.formatearFecha(this.dateFin) : '';

    this.transporteService.getAllOrder(
      this.model.remitente_id,
      this.model.estado_id,
      this.usuarioId,
      fec_ini,
      fec_fin,
      this.model.shipment
    ).subscribe({
      next: (resp) => {
        this.ordenesTransporte = resp;
        this.aplicarFiltro();
        this.loading = false;
        setTimeout(() => this.scrollToResultados(), 100);
      },
      error: (err) => {
        console.error('Error al cargar órdenes de transporte:', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las órdenes de transporte' });
      }
    });
  }

  // --- SUBIR FOTO ---

  abrirSubirFoto(orden: OrdenTransporteResult): void {
    this.ordenSeleccionada = orden;
    this.archivoSeleccionado = null;
    this.errorArchivo = '';
    this.displaySubirFoto = true;
  }

  onFotoSelect(event: any): void {
    this.errorArchivo = '';
    const file: File = event.files?.[0] ?? event.currentFiles?.[0];
    if (!file) return;

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      this.errorArchivo = 'Solo se permiten imágenes JPG o PNG.';
      return;
    }
    if (file.size > this.MAX_SIZE_BYTES) {
      this.errorArchivo = `El archivo excede el límite de 5 MB (${(file.size / 1024 / 1024).toFixed(2)} MB).`;
      return;
    }
    this.archivoSeleccionado = file;
  }

  subirFoto(event: any): void {
    const file: File = event.files?.[0];
    if (!file || !this.ordenSeleccionada) return;

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      this.messageService.add({ severity: 'warn', summary: 'Archivo inválido', detail: 'Solo se permiten imágenes JPG o PNG.' });
      return;
    }
    if (file.size > this.MAX_SIZE_BYTES) {
      this.messageService.add({ severity: 'warn', summary: 'Archivo muy grande', detail: `Máximo 5 MB. Este archivo pesa ${(file.size / 1024 / 1024).toFixed(2)} MB.` });
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    this.subiendoFoto = true;
    this.transporteService.subirFoto(this.ordenSeleccionada.id, formData).subscribe({
      next: () => {
        this.subiendoFoto = false;
        this.displaySubirFoto = false;
        this.messageService.add({ severity: 'success', summary: 'Foto subida', detail: 'La imagen se guardó correctamente.' });
      },
      error: (err) => {
        this.subiendoFoto = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo subir la foto.' });
      }
    });
  }

  // --- VER FOTOS ---

  abrirVerFotos(orden: OrdenTransporteResult): void {
    this.ordenSeleccionada = orden;
    this.fotosOrden = [];
    this.cargandoFotos = true;
    this.displayVerFotos = true;

    this.transporteService.getFotos(orden.id).subscribe({
      next: (fotos) => {
        this.fotosOrden = fotos;
        this.cargandoFotos = false;
      },
      error: () => {
        this.cargandoFotos = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las fotos.' });
      }
    });
  }

  // --- Helpers ---

  formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  scrollToResultados(): void {
    if (this.resultadosBlock) {
      this.resultadosBlock.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  aplicarFiltro(): void {
    if (!this.filtroGeneral || this.filtroGeneral.trim() === '') {
      this.ordenesFiltradas = [...this.ordenesTransporte];
    } else {
      const filtro = this.filtroGeneral.toLowerCase().trim();
      this.ordenesFiltradas = this.ordenesTransporte.filter(item => {
        return (item.numero_ot || '').toLowerCase().includes(filtro) ||
               (item.shipment || '').toLowerCase().includes(filtro) ||
               (item.delivery || '').toLowerCase().includes(filtro) ||
               (item.remitente || '').toLowerCase().includes(filtro) ||
               (item.destinatario || '').toLowerCase().includes(filtro) ||
               (item.factura || '').toLowerCase().includes(filtro) ||
               (item.oc || '').toLowerCase().includes(filtro) ||
               (item.guias || '').toLowerCase().includes(filtro);
      });
    }
  }

  onFiltroChange(): void {
    this.aplicarFiltro();
  }

  limpiarFiltros(): void {
    this.model = {};
    this.dateInicio = new Date();
    this.dateFin = new Date();
    this.filtroGeneral = '';
    this.ordenesTransporte = [];
    this.ordenesFiltradas = [];
  }
}
