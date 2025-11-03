import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { EquipoTransporte } from '../../recepcion/recepcion.types';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ClienteService } from '../../_services/cliente.service';
import { GeneralService } from '../../_services/general.service';
import { Router } from '@angular/router';
import { RecepcionService } from '../../recepcion/recepcion.service';
import { forkJoin } from 'rxjs';
import { AlmacenService } from '../../_services/almacen.service';
import { AlmacenajeService } from '../almacenaje.service';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-listtransporte',
  templateUrl: './listtransporte.component.html',
  styleUrls: ['./listtransporte.component.css'],
  standalone: true,
  imports: [
    MatIcon,
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ConfirmDialogModule,
    ToastModule
    ],
    providers: [ ConfirmationService,
      MessageService 
    ]
})
export class ListtransporteComponent implements OnInit {

  cols = [
    { header: 'ACCIONES', field: 'id', width: '100px' },
    { header: 'ALMACÉN', field: 'almacen', width: '140px' },
    { header: 'EQ. TRANSPORTE', field: 'equipoTransporte', width: '180px' },
    { header: 'PUERTA', field: 'puerta', width: '140px' },
    { header: 'PLACA', field: 'placa', width: '100px' },
    { header: 'MARCA', field: 'marca', width: '100px' },
    { header: 'TIPO VEHÍCULO', field: 'equipotransporte', width: '140px' },
    { header: 'ESTADO', field: 'fechaEsperada', width: '130px' },
  ];

  es: any;
  loading = false;
  transportes: EquipoTransporte[] = [];
  clientes: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  model: any = {};

  dateInicio: Date = new Date();
  dateFin: Date = new Date();



  estados: SelectItem[] = [
    { value: 131, label: 'Llegada y Asignado' },
    { value: 13, label: 'Llegada' },
    { value: 14, label: 'Asignado' },
    { value: 15, label: 'En Descarga' },
    { value: 16, label: 'Cerrado' },
  ];

  constructor(
    private almacenajeService:  AlmacenajeService,
    private clienteService: ClienteService,
    private generalService: GeneralService,
    private propietarioService: PropietarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.configurarCalendario();
    this.inicializarFechas();
    this.cargarCombosIniciales();
  }

  private configurarCalendario(): void {
    this.es = {
      firstDayOfWeek: 1,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ],
      monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      today: 'Hoy',
      clear: 'Borrar'
    };
  }

  private inicializarFechas(): void {
    const hoy = new Date();
    this.dateInicio = new Date(hoy);
    this.dateInicio.setDate(hoy.getDate() - 5);
    this.dateFin = hoy;

    this.model = {
      fec_ini: this.dateInicio,
      fec_fin: this.dateFin,
      EstadoId: 131
    };
  }

  private cargarCombosIniciales(): void {
    this.loading = true;

    forkJoin([
      this.generalService.getAllAlmacenes(),
      this.propietarioService.getAllPropietarios()
    ]).subscribe({
      next: ([almacenes, propietarios]) => {
        this.almacenes = almacenes.map(a => ({ value: a.id, label: a.descripcion }));
        this.clientes = propietarios.map(c => ({ label: c.razonSocial.toUpperCase(), value: c.id }));

        this.model.PropietarioId = parseInt(localStorage.getItem('PropietarioId') || '1', 10);
        this.model.AlmacenId = parseInt(localStorage.getItem('AlmacenId') || '1', 10);

        this.cargarTransportes();
      },
      error: () => this.loading = false
    });
  }

  private cargarTransportes(): void {
    this.almacenajeService.ListarEquiposTransporte(
      // this.model.fec_ini,
      // this.model.fec_fin,
      this.model.EstadoId,
      this.model.PropietarioId,
      this.model.AlmacenId
    ).subscribe({
      next: (list) => {
        this.transportes = list;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  buscar(): void {
    this.loading = true;
    this.model.fec_ini = this.dateInicio;
    this.model.fec_fin = this.dateFin;

    localStorage.setItem('AlmacenId', this.model.AlmacenId);
    localStorage.setItem('PropietarioId', this.model.PropietarioId);
    localStorage.setItem('Intervalo', this.model.intervalo);
    localStorage.setItem('Estado', this.model.EstadoId);

    this.cargarTransportes();
  }

  openDoor(id: number, almacenId: number): void {
    this.router.navigate(['recibo/asignarpuerta', id, almacenId]);
  }

  openEquipoTransporte(id: number): void {
    this.router.navigate(['recibo/listaordenrecibida', id]);
  }
}