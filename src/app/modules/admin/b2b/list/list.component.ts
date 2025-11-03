import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
    ConfirmationService,
    MenuItem,
    MessageService,
    SelectItem,
} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogModule,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { PropietarioService } from '../../_services/propietario.service';
import { DespachosService } from '../../despachos/despachos.service';
import { OrdenSalida } from '../../despachos/despachos.types';
import { B2bService } from '../b2b.service';
import { PedidoDetalle } from '../b2b.types';
import { PlanningService } from '../../planning/planning.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    standalone: true,
    imports: [
        MatIcon,
        InputTextModule,
        DropdownModule,
        FormsModule,
        ButtonModule,
        TableModule,
        CommonModule,
        DialogModule,
        TimelineModule,
        CardModule,
        DynamicDialogModule,
        ToastModule,
        CalendarModule,
        ConfirmDialogModule,
        SplitButtonModule,
    ],
    providers: [DialogService, MessageService, ConfirmationService],
})
export class ListComponent implements OnInit {
    ref: DynamicDialogRef | undefined;
    ocResults: any[];
    searchCriteria = { oc: '', sku: '' };
    clientes: SelectItem[] = [];
    familias: any[] = [];
    subfamilias: any[] = [];
    cols: any[];
    cols2: any[];
    detalleOCModal = false;
    CicloVidaOCModal = false;
    Items: any[];
    selectedOC: any = {};

    items: MenuItem[];

    jwtHelper = new JwtHelperService();
    decodedToken: any = {};

    selectedRubro: any;
    selectedFamilia: any;
    selectedSubfamilia: any;
    selectedRow: OrdenSalida[] = [];

    model: any = { guiaremision: '' };
    ordenes: OrdenSalida[] = [];

    dateInicio: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));
    dateFin: Date = new Date();

    detalleOrdenModal = false;
    detalleProductos: PedidoDetalle[] = [];
    loadingDetalle = false;


    constructor(
        public dialogService: DialogService,
        private despachosService: DespachosService,
        private propietarioService: PropietarioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private b2bService: B2bService,
         private planningService: PlanningService,
        private router: Router
    ) {}

  ngOnInit(): void {
  const token = localStorage.getItem('token');
  this.decodedToken = this.jwtHelper.decodeToken(token);

  // Guardar el id de usuario
  const usuarioId = this.decodedToken.nameid;

  this.cols = [
    { header: 'ACCIONES', field: 'numOrden', width: '140px' },
    { header: 'ORS', field: 'numOrden', width: '120px' },
    { header: 'ESTADO', field: 'nombreEstado', width: '100px' },
    { header: 'GR SALIDA', field: 'guiaRemision', width: '160px' },
    { header: 'ORDEN COMPRA', field: 'ordenCompraCliente', width: '140px' },
    { header: 'REGISTRADO POR', field: 'TipoRegistro', width: '220px' },
    { header: 'F. REQUERIDA', field: 'fechaEsperada', width: '120px' },
    { header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px' },
  ];

  this.propietarioService.getPropietariosByUsuario(usuarioId).subscribe({
    next: (resp) => {
      this.clientes = resp.map((x) => ({
        value: x.id,
        label: x.razonSocial
      }));

      // ✅ Si solo hay un propietario, seleccionarlo automáticamente
      if (this.clientes.length === 1) {
        this.model.PropietarioId = this.clientes[0].value;
      }
    },
    error: (err) => console.error('Error al cargar propietarios:', err),
    complete: () => this.buscar() // ✅ Buscar una vez que se cargaron los propietarios
  });
}


    buscar() {
        this.model.fec_ini = this.dateInicio;
        this.model.fec_fin = this.dateFin;

   

        this.despachosService
            .getAllOrdenSalida(this.model)
            .subscribe((list) => {
                this.ordenes = list;

                console.log('ordenes', this.ordenes);
            });
    }

    
  edit(id): void {


     this.router.navigate(['/b2b/edit', id]);

   
  }


   getEstadoClass(estado: string): string {
  switch (estado) {
    case 'Creado':
      return 'estado-badge estado-creado';
    case 'Planificado':
      return 'estado-badge estado-planificado';
    case 'Asignado':
      return 'estado-badge estado-asignado';
    case 'Despachado':
      return 'estado-badge estado-despachado';
    case 'Validado':
      return 'estado-badge estado-validado';
    default:
      return 'estado-badge';
  }
}planificar(rowData: any): void {
  // ✅ Validar propietario seleccionado
  if (!this.model.PropietarioId) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Debe seleccionar un propietario antes de planificar.'
    });
    return;
  }

  // ✅ Obtener usuario desde token
  const token = localStorage.getItem('token');
  const jwtHelper = new JwtHelperService();
  const decodedToken = token ? jwtHelper.decodeToken(token) : null;
  const usuarioId = decodedToken?.nameid ? Number(decodedToken.nameid) : 0;

  // ✅ Confirmar acción antes de enviar al backend
  this.confirmationService.confirm({
    header: 'Confirmar planificación',
    message: `¿Desea planificar la orden ${rowData.numOrden}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, planificar',
    rejectLabel: 'Cancelar',
    acceptButtonStyleClass: 'p-button-success',
    rejectButtonStyleClass: 'p-button-secondary',
    accept: () => {
      const payload = {
        Ids: rowData.ordenSalidaId.toString(),
        PropietarioId: this.model.PropietarioId,
        UsuarioId: usuarioId,
        FechaDespacho: new Date(),
        IdTipoVehiculo: null,
        placa: null
      };

      console.log('📦 Enviando payload:', payload);

      this.planningService.PlanificarPicking(payload).subscribe({
        next: (resp: any) => {
          if (resp?.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Planificación exitosa',
              detail: `Orden ${rowData.numOrden} planificada correctamente.`
            });
            this.buscar(); // 🔄 Recargar lista
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Aviso',
              detail: resp?.message || 'No se pudo planificar la orden.'
            });
          }
        },
        error: (err) => {
          console.error('❌ Error al planificar:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al planificar la orden.'
          });
        }
      });
    }
  });
}


    ver(ordenSalidaId: number): void {
        this.detalleOrdenModal = true;
        this.loadingDetalle = true;
        this.detalleProductos = [];

        this.b2bService.obtenerDetallePedido(ordenSalidaId).subscribe({
          next: (res) => {
            this.detalleProductos = res.data || [];
            this.loadingDetalle = false;
            console.log('Detalle de la orden:', this.detalleProductos);


          },
          error: (err) => {
            console.error(err);
            this.loadingDetalle = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo obtener el detalle de la orden.'
      });
    }
  });
    }

    nuevaorden() {
        this.router.navigate(['/b2b/new']);
    }
    nuevaordenmasiva() {
        this.router.navigate(['/picking/nuevasalidamasiva']);
    }

    delete(id) {
        this.confirmationService.confirm({
            message: '¿Está seguro que desea eliminar el despacho?',
            header: 'Eliminar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.despachosService.deleteOrder(id).subscribe((x) => {
                    this.buscar();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'TWH',
                        detail: 'Se eliminó correctamente.',
                    }); //success('Se registró correctamente.');
                });
            },
            reject: () => {},
        });
    }
}
