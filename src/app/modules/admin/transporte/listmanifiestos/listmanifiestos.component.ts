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
    CalendarModule
  ]
})
export class ListmanifiestosComponent implements OnInit {
  
  @ViewChild('resultadosBlock') resultadosBlock!: ElementRef;

  cols: any[] = [];
  loading = false;
  manifiestos: ManifiestoResult[] = [];
  manifiestosFiltrados: ManifiestoResult[] = [];
  
  remitentes: SelectItem[] = [];
  model: any = {};
  
  dateInicio: Date = new Date();
  dateFin: Date = new Date();
  
  filtroGeneral: string = '';

  es: any;

  constructor(
    private transporteService: TransporteService,
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
      { header: 'NÚMERO MANIFIESTO', field: 'numero_manifiesto', width: '150px' },
      { header: 'SHIPMENT', field: 'shipment', width: '120px' },
      { header: 'ESTADO', field: 'estado', width: '120px' },
      { header: 'PLACA', field: 'Placa', width: '100px' },
      { header: 'CHOFER', field: 'Chofer', width: '150px' },
      { header: 'VALORIZADO', field: 'valorizado', width: '120px' },
      { header: 'SOBREESTADÍA', field: 'sobreestadia_tarifa', width: '120px' },
      { header: 'ADICIONALES', field: 'adicionales_tarifa', width: '120px' },
      { header: 'FECHA SALIDA', field: 'fecha_salida', width: '120px' },
      { header: 'FECHA REGISTRO', field: 'fecha_registro', width: '120px' },
      { header: 'CAPACIDAD MÁXIMA', field: 'capacidadMaxima', width: '130px' },
      { header: 'CAPACIDAD UTILIZADA', field: 'capacidadUtilizada', width: '140px' }
    ];
  }

  cargarDatosIniciales(): void {
    // Cargar remitentes (propietarios)
    this.propietarioService.getAllPropietarios().subscribe(resp => {
      this.remitentes.push({ label: 'Todos', value: undefined });
      resp.forEach(element => {
        this.remitentes.push({ 
          label: element.razonSocial.toUpperCase(), 
          value: element.id.toString()
        });
      });
    });
  }

  buscar(): void {
    this.loading = true;
    
    const fec_ini = this.dateInicio ? this.formatearFecha(this.dateInicio) : '';
    const fec_fin = this.dateFin ? this.formatearFecha(this.dateFin) : '';
    const remitente_id = this.model.remitente_id ? this.model.remitente_id.toString() : '';
    
    this.transporteService.listarManifiestos(
      remitente_id,
      fec_ini,
      fec_fin,
      this.model.numero_manifiesto
    ).subscribe({
      next: (resp) => {
        this.manifiestos = resp;
        this.aplicarFiltro();
        this.loading = false;
        
        // Scroll hasta el bloque de resultados
        setTimeout(() => {
          this.scrollToResultados();
        }, 100);
      },
      error: (err) => {
        console.error('Error al cargar manifiestos:', err);
        this.loading = false;
        alert('Error al cargar los manifiestos');
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
      this.manifiestosFiltrados = [...this.manifiestos];
    } else {
      const filtro = this.filtroGeneral.toLowerCase().trim();
      this.manifiestosFiltrados = this.manifiestos.filter(item => {
        const numeroManifiesto = (item.numero_manifiesto || '').toLowerCase();
        const shipment = (item.shipment || '').toLowerCase();
        const estado = (item.estado || '').toLowerCase();
        const placa = (item.Placa || '').toLowerCase();
        const chofer = (item.Chofer || '').toLowerCase();
        
        return numeroManifiesto.includes(filtro) || 
               shipment.includes(filtro) || 
               estado.includes(filtro) ||
               placa.includes(filtro) ||
               chofer.includes(filtro);
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
    this.manifiestos = [];
    this.manifiestosFiltrados = [];
  }
}

