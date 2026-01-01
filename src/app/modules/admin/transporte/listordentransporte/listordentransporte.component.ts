import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { SelectItem } from 'primeng/api';
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
    CalendarModule
  ]
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

  constructor(
    private transporteService: TransporteService,
    private generalService: GeneralService,
    private propietarioService: PropietarioService
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
      { header: 'NÚMERO OT', field: 'numero_ot', width: '120px' },


      { header: 'NÚMERO MANIFIESTO', field: 'numero_manifiesto', width: '150px' },
      { header: 'ESTADO', field: 'Estado', width: '120px' },
      { header: 'TIPO ENTREGA', field: 'TipoEntrega', width: '120px' },
      { header: 'PLACA', field: 'Placa', width: '100px' },



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

      { header: 'CHOFER', field: 'Chofer', width: '150px' },
      { header: 'POR ASIGNAR', field: 'por_asignar', width: '100px' }
    ];
  }

  cargarDatosIniciales(): void {
    // Obtener usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      this.decodedToken = this.jwtHelper.decodeToken(token);
      this.usuarioId = parseInt(this.decodedToken.nameid || '0');
    }

    // Cargar remitentes (propietarios)
    this.propietarioService.getAllPropietarios().subscribe(resp => {
      this.remitentes.push({ label: 'Todos', value: undefined });
      resp.forEach(element => {
        this.remitentes.push({ 
          label: element.razonSocial.toUpperCase(), 
          value: element.id 
        });
      });
    });

    // Cargar estados
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
        
        // Scroll hasta el bloque de resultados
        setTimeout(() => {
          this.scrollToResultados();
        }, 100);
      },
      error: (err) => {
        console.error('Error al cargar órdenes de transporte:', err);
        this.loading = false;
        alert('Error al cargar las órdenes de transporte');
      }
    });
  }

  formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  scrollToResultados(): void {
    if (this.resultadosBlock) {
      this.resultadosBlock.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  aplicarFiltro(): void {
    if (!this.filtroGeneral || this.filtroGeneral.trim() === '') {
      this.ordenesFiltradas = [...this.ordenesTransporte];
    } else {
      const filtro = this.filtroGeneral.toLowerCase().trim();
      this.ordenesFiltradas = this.ordenesTransporte.filter(item => {
        const numeroOt = (item.numero_ot || '').toLowerCase();
        const shipment = (item.shipment || '').toLowerCase();
        const delivery = (item.delivery || '').toLowerCase();
        const remitente = (item.remitente || '').toLowerCase();
        const destinatario = (item.destinatario || '').toLowerCase();
        const factura = (item.factura || '').toLowerCase();
        const oc = (item.oc || '').toLowerCase();
        const guias = (item.guias || '').toLowerCase();
        
        return numeroOt.includes(filtro) || 
               shipment.includes(filtro) || 
               delivery.includes(filtro) ||
               remitente.includes(filtro) ||
               destinatario.includes(filtro) ||
               factura.includes(filtro) ||
               oc.includes(filtro) ||
               guias.includes(filtro);
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

