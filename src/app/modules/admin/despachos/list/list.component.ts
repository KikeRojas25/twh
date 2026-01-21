import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DespachosService } from '../despachos.service';
import { ClienteService } from '../../_services/cliente.service';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenSalida } from '../despachos.types';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PropietarioService } from '../../_services/propietario.service';
import { GeneralService } from '../../_services/general.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { OrdenSalidaCabeceraDialogComponent } from '../neworder/dialogs/orden-salida-cabecera-dialog.component';
import { OrdenSalidaDetalleDialogComponent } from '../neworder/dialogs/orden-salida-detalle-dialog.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone:true,
  imports: [MatIcon, 
    InputTextModule, 
    DropdownModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CommonModule,
    DialogModule   ,
    TimelineModule ,
    CardModule ,
    DynamicDialogModule ,
    ToastModule,
    CalendarModule,
    ConfirmDialogModule,
    TooltipModule,
    ],
    providers: [
      DialogService,
      MessageService,
      ConfirmationService
    ]
})
export class ListComponent implements OnInit {

  ref: DynamicDialogRef | undefined;
  ocResults: any[];
  searchCriteria = { oc: '', sku: '' };
  clientes: SelectItem[] = [];
  almacenes: SelectItem[] = [];
  estadosOrdenSalida: SelectItem[] = [];
  familias: any[] = [];
  subfamilias: any[] = [];
  cols: any[];
  cols2: any[];
  detalleOCModal = false;
  CicloVidaOCModal = false;
  Items: any[];
  selectedOC : any = {};

  selectedRubro: any;
  selectedFamilia: any;
  selectedSubfamilia: any;
  selectedRow: OrdenSalida[] = [];

  model: any = { guiaremision : ''};
  ordenes: OrdenSalida[] = [];
  
  // Variables para el diálogo de fecha de salida
  mostrarDialogFechaSalida = false;
  ordenSalidaSeleccionada: OrdenSalida | null = null;
  fechaSalidaEditada: Date = new Date();

  dateInicio: Date = new Date(Date.now()) ;
  dateFin: Date = new Date(Date.now()) ;
  
  es: any;
  tieneRol1: boolean = false;
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};

  constructor(
    public dialogService: DialogService,
    private despachosService: DespachosService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private generalService: GeneralService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService ,
    private router: Router,
  ) { }

  
  ngOnInit(): void {
    // Verificar rol del usuario
    this.verificarRolUsuario();

    // Estados (ORS) - hardcodeados según catálogo provisto
    this.estadosOrdenSalida = [
      { label: 'Creado', value: 21 },
      { label: 'Planificado', value: 22 },
      { label: 'Pendiente picking', value: 23 },
      { label: 'Despachado', value: 24 },
      { label: 'Pendiente Validación', value: 34 },
      { label: 'Validado', value: 47 },
    ];

    // Configurar calendario en español
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

    this.cols2 = [
      { header: 'CÓDIGO', backgroundcolor: '#125ea3', field: 'ProductoId', width: '100px' },
      { header: 'PRODUCTO', backgroundcolor: '#125ea3', field: 'producto', width: '150px' },
      { header: 'LOTE', backgroundcolor: '#125ea3', field: 'Lote', width: '100px' },
      { header: 'CANTIDAD', backgroundcolor: '#125ea3', field: 'cantidad', width: '90px' },
      { header: 'ESTADO', backgroundcolor: '#125ea3', field: 'EstadoId', width: '90px' },
    ]

    this.cols =
    [
        {header: 'ACCIONES', field: 'numOrden' , width: '260px' },
        {header: 'ORS', field: 'numOrden'  ,  width: '120px' },
        {header: 'PROPIETARIO', field: 'propietario'  , width: '200px'   },
        {header: 'ESTADO', field: 'nombreEstado'  ,  width: '100px'  },
        {header: 'GR SALIDA', field: 'guiaRemision' , width: '160px'  },
        {header: 'REF INGRESO', field: 'equipotransporte'  , width: '140px'  },
        {header: 'REGISTRADO POR', field: 'TipoRegistro'  , width: '220px'  },
        {header: 'F. REQUERIDA', field: 'fechaEsperada'  , width: '120px'  },
        {header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px'    },
      ];

    // Recuperar valores guardados del localStorage antes de cargar dropdowns (solo fechas y guía)
    this.cargarFiltrosDesdeLocalStorage();

    // Cargar almacenes primero
    this.cargarAlmacenes();
  
    // Cargar propietarios
    this.propietarioService.getAllPropietarios().subscribe(resp => {
      resp.forEach(resp => {
        this.clientes.push({value: resp.id , label: resp.razonSocial });
      });

      // Después de cargar los propietarios, restaurar la selección guardada
      this.restaurarPropietarioSeleccionado();
    });
  }

  


  buscar(){
  
    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;

    // Normalizar filtro de estado para compatibilidad (UI usa estadoIdfiltro; antes se usaba EstadoId)
    if (this.model.estadoIdfiltro === undefined || this.model.estadoIdfiltro === null || this.model.estadoIdfiltro === '') {
      if (this.model.EstadoId !== undefined && this.model.EstadoId !== null && this.model.EstadoId !== '') {
        this.model.estadoIdfiltro = this.model.EstadoId;
      }
    }
  
    // Guardar todos los filtros en localStorage con prefijo específico para despachos
    // Guardar PropietarioId (incluso si es null/undefined para permitir limpiar el filtro)
    if (this.model.PropietarioId !== null && this.model.PropietarioId !== undefined) {
      localStorage.setItem('despachos_PropietarioId', this.model.PropietarioId.toString());
    } else {
      localStorage.removeItem('despachos_PropietarioId');
    }
    
    // Guardar AlmacenId (incluso si es null/undefined para permitir limpiar el filtro)
    if (this.model.AlmacenId !== null && this.model.AlmacenId !== undefined) {
      localStorage.setItem('despachos_AlmacenId', this.model.AlmacenId.toString());
    } else {
      localStorage.removeItem('despachos_AlmacenId');
    }
    if (this.model.intervalo) {
      localStorage.setItem('despachos_Intervalo', this.model.intervalo);
    }
    // Estado: persistir estadoIdfiltro (compat: usar la misma key existente)
    if (this.model.estadoIdfiltro !== null && this.model.estadoIdfiltro !== undefined && this.model.estadoIdfiltro !== '') {
      localStorage.setItem('despachos_Estado', String(this.model.estadoIdfiltro));
    } else {
      localStorage.removeItem('despachos_Estado');
    }
    if (this.dateInicio) {
      localStorage.setItem('despachos_DateInicio', this.dateInicio.toISOString());
    }
    if (this.dateFin) {
      localStorage.setItem('despachos_DateFin', this.dateFin.toISOString());
    }
    // Guardar guía de remisión (incluso si está vacía para permitir limpiar)
    if (this.model.guiaremision) {
      localStorage.setItem('despachos_GuiaRemision', this.model.guiaremision);
    } else {
      localStorage.removeItem('despachos_GuiaRemision');
    }
    
    // También mantener los valores sin prefijo para compatibilidad
    if (this.model.PropietarioId !== null && this.model.PropietarioId !== undefined) {
      localStorage.setItem('PropietarioId', this.model.PropietarioId.toString());
    } else {
      localStorage.removeItem('PropietarioId');
    }
    
    if (this.model.AlmacenId !== null && this.model.AlmacenId !== undefined) {
      localStorage.setItem('AlmacenId', this.model.AlmacenId.toString());
    } else {
      localStorage.removeItem('AlmacenId');
    }
    if (this.model.intervalo) {
      localStorage.setItem('Intervalo', this.model.intervalo);
    }
    // compat: mantener key antigua, pero con el valor normalizado
    if (this.model.estadoIdfiltro !== null && this.model.estadoIdfiltro !== undefined && this.model.estadoIdfiltro !== '') {
      localStorage.setItem('Estado', String(this.model.estadoIdfiltro));
    } else {
      localStorage.removeItem('Estado');
    }
  
    this.despachosService.getAllOrdenSalida(this.model).subscribe(list => {
        this.ordenes = list;

        console.log('ordenes', this.ordenes);

        });
     }

  cargarAlmacenes() {
    this.generalService.getAllAlmacenes().subscribe(resp => {
      this.almacenes.push({ label: "Todos", value: undefined });
      resp.forEach(element => {
        this.almacenes.push({ value: element.id, label: element.descripcion });
      });

      // Después de cargar los almacenes, restaurar la selección guardada
      this.restaurarAlmacenSeleccionado();
      
      // Intentar ejecutar búsqueda si ambos dropdowns están listos
      this.intentarBuscarSiTodoListo();
    });
  }

  restaurarAlmacenSeleccionado() {
    const almacenIdGuardado = localStorage.getItem('despachos_AlmacenId');
    if (almacenIdGuardado && this.almacenes.length > 0) {
      // Intentar encontrar por valor numérico o string
      const almacenIdNum = parseInt(almacenIdGuardado, 10);
      const existe = this.almacenes.find(a => 
        a.value === almacenIdNum || 
        a.value === almacenIdGuardado ||
        (a.value !== undefined && a.value.toString() === almacenIdGuardado)
      );
      if (existe) {
        this.model.AlmacenId = existe.value;
        console.log('Almacén restaurado:', existe.label);
      }
    }
    
    // Intentar ejecutar búsqueda si ambos dropdowns están listos
    this.intentarBuscarSiTodoListo();
  }

  restaurarPropietarioSeleccionado() {
    const propietarioIdGuardado = localStorage.getItem('despachos_PropietarioId');
    if (propietarioIdGuardado && this.clientes.length > 0) {
      const id = parseInt(propietarioIdGuardado, 10);
      const existe = this.clientes.find(c => c.value === id);
      if (existe) {
        this.model.PropietarioId = id;
        console.log('Propietario restaurado:', existe.label);
      }
    }
    
    // Intentar ejecutar búsqueda si ambos dropdowns están listos
    this.intentarBuscarSiTodoListo();
  }

  intentarBuscarSiTodoListo() {
    // Solo buscar si ambos dropdowns están cargados
    if (this.almacenes.length > 0 && this.clientes.length > 0) {
      // Dar un pequeño delay para asegurar que los valores se establecieron
      setTimeout(() => {
        this.buscar();
      }, 100);
    }
  }

  cargarFiltrosDesdeLocalStorage(): void {
    // Solo recuperar fechas y guía aquí, los dropdowns se restaurarán después de cargarse
    // Los valores de PropietarioId y AlmacenId se restaurarán en restaurarPropietarioSeleccionado() y restaurarAlmacenSeleccionado()

    // Recuperar fechas
    const dateInicioStr = localStorage.getItem('despachos_DateInicio');
    if (dateInicioStr) {
      this.dateInicio = new Date(dateInicioStr);
    }

    const dateFinStr = localStorage.getItem('despachos_DateFin');
    if (dateFinStr) {
      this.dateFin = new Date(dateFinStr);
    }

    // Recuperar número de guía
    const guiaRemision = localStorage.getItem('despachos_GuiaRemision');
    if (guiaRemision) {
      this.model.guiaremision = guiaRemision;
    }

    const intervalo = localStorage.getItem('despachos_Intervalo');
    if (intervalo) {
      this.model.intervalo = intervalo;
    }

    const estado = localStorage.getItem('despachos_Estado');
    if (estado) {
      // Usar la propiedad alineada al servicio; mantener también la legacy por compatibilidad
      this.model.estadoIdfiltro = estado;
      this.model.EstadoId = estado;
    }
  }





  verDetalle(rowData: OrdenSalida) {
    this.detalleOCModal = true;
    this.Items = []; // Limpiar items anteriores
    
    // Obtener el ID de la orden (puede ser ordenSalidaId o id)
    const ordenSalidaId = rowData.ordenSalidaId || rowData.id;
    
    if (!ordenSalidaId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la orden de salida.'
      });
      return;
    }

    this.despachosService.obtenerDetalleOrdenSalida(ordenSalidaId).subscribe({
      next: (data) => {
        this.Items = data || [];
        console.log('Detalle de la orden:', this.Items);
      },
      error: (err) => {
        console.error('Error al obtener detalle:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el detalle de la orden de salida.'
        });
        this.Items = [];
      }
    });
  }

  edit(rowData: any) {
    const ordenSalidaId: any = rowData?.ordenSalidaId || rowData?.id;
    if (!ordenSalidaId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la orden de salida.'
      });
      return;
    }

    // Reglas: admin (rol 1) puede editar siempre; otros solo cuando está Planificado
    if (!this.puedeEditar(rowData)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: this.tieneRol1
          ? 'No tiene permisos para editar esta orden.'
          : 'Solo se puede editar la cabecera cuando la orden está en estado Planificado.'
      });
      return;
    }

    this.ref = this.dialogService.open(OrdenSalidaCabeceraDialogComponent, {
      header: `Editar cabecera (ORS ${ordenSalidaId})`,
      width: '70rem',
      style: { 'max-width': '95vw' },
      modal: true,
      data: {
        mode: 'edit',
        ordenSalidaId: Number(ordenSalidaId)
      }
    });

    this.ref.onClose.subscribe((result: any) => {
      if (result?.success) {
        this.buscar();
      }
    });
  }

  nuevaorden() {
    this.router.navigate(['/picking/nuevaordensalida']);
  }

  nuevaordenmasiva() {
    this.router.navigate(['/picking/nuevasalidamasiva']);
  }

  nuevaOrdenB2B() {
    // Abrir flujo en 2 modales: cabecera -> detalle
    this.ref = this.dialogService.open(OrdenSalidaCabeceraDialogComponent, {
      header: 'Nueva Orden - Cabecera',
      width: '70rem',
      style: { 'max-width': '95vw' },
      modal: true,
      data: {
        propietarioId: this.model?.PropietarioId ?? null,
        almacenId: this.model?.AlmacenId ?? null
      }
    });

    this.ref.onClose.subscribe((cabeceraResult: any) => {
      if (!cabeceraResult?.ordenSalidaId) {
        return;
      }

      this.ref = this.dialogService.open(OrdenSalidaDetalleDialogComponent, {
        header: `Nueva Orden - Detalle (ORS ${cabeceraResult.ordenSalidaId})`,
        width: '90rem',
        style: { 'max-width': '98vw' },
        modal: true,
        data: cabeceraResult
      });

      this.ref.onClose.subscribe((detalleResult: any) => {
        if (detalleResult?.success) {
          this.buscar();
        }
      });
    });
  }

  agregarDetalle(rowData: OrdenSalida): void {
    const ordenSalidaId: any = (rowData as any).ordenSalidaId || (rowData as any).id;
    if (!ordenSalidaId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener el ID de la orden de salida.'
      });
      return;
    }

    if ((rowData as any).nombreEstado !== 'Creado') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Solo se puede agregar detalle cuando la orden está en estado Creado.'
      });
      return;
    }

    const propietarioId = Number((rowData as any).propietarioId ?? (rowData as any).PropietarioId);
    const almacenId = Number((rowData as any).almacenId ?? (rowData as any).AlmacenId);

    const abrirModal = (pid: number, aid: number) => {
      this.ref = this.dialogService.open(OrdenSalidaDetalleDialogComponent, {
        header: `Agregar detalle (ORS ${ordenSalidaId})`,
        width: '90rem',
        style: { 'max-width': '98vw' },
        modal: true,
        data: {
          ordenSalidaId: Number(ordenSalidaId),
          cabeceraPayload: { PropietarioId: pid, AlmacenId: aid }
        }
      });

      this.ref.onClose.subscribe((detalleResult: any) => {
        if (detalleResult?.success) {
          this.buscar();
        }
      });
    };

    // Si la fila no trae PropietarioId, obtenerlo antes de abrir el modal (necesario para buscar productos)
    if (Number.isFinite(propietarioId) && propietarioId > 0 && Number.isFinite(almacenId) && almacenId > 0) {
      abrirModal(propietarioId, almacenId);
      return;
    }

    this.despachosService.obtenerOrdenSalidaPorId(Number(ordenSalidaId)).subscribe({
      next: (orden: any) => {
        const pid = Number(orden?.propietarioId ?? orden?.PropietarioId);
        const aid = Number(orden?.almacenId ?? orden?.AlmacenId);
        if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(aid) || aid <= 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener Propietario/Almacén de la orden.'
          });
          return;
        }
        abrirModal(pid, aid);
      },
      error: (err) => {
        console.error('Error al obtener orden:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener la orden para abrir el detalle.'
        });
      }
    });
  }

  delete(id: number) {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.despachosService.deleteOrder(id).subscribe(x => {
          this.buscar();
          this.messageService.add({
            severity: 'success',
            summary: 'TWH',
            detail: 'Se eliminó correctamente.'
          });
        });
      },
      reject: () => {
        // Usuario canceló
      }
    });
  }

  editarFechaSalida(rowData: OrdenSalida): void {
    this.ordenSalidaSeleccionada = rowData;
    // Si tiene fecha de salida, usarla; si no, usar la fecha requerida como referencia
    this.fechaSalidaEditada = (rowData as any).fechaSalida 
      ? new Date((rowData as any).fechaSalida) 
      : (rowData.fechaRequerida ? new Date(rowData.fechaRequerida) : new Date());
    this.mostrarDialogFechaSalida = true;
  }

  guardarFechaSalida(): void {
    if (!this.ordenSalidaSeleccionada) {
      return;
    }

    if (!this.fechaSalidaEditada) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar una fecha válida.'
      });
      return;
    }

    const ordenSalidaId = this.ordenSalidaSeleccionada.ordenSalidaId || this.ordenSalidaSeleccionada.id;

    this.despachosService.actualizarFechaSalida(ordenSalidaId, this.fechaSalidaEditada).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: response.message || 'Fecha de salida actualizada correctamente.'
        });
        this.mostrarDialogFechaSalida = false;
        this.ordenSalidaSeleccionada = null;
        this.buscar(); // Recargar la lista
      },
      error: (error) => {
        console.error('Error al actualizar fecha de salida:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || error?.message || 'Error al actualizar la fecha de salida.'
        });
        
      },
      complete: () => {
      
      }
    });
  }

  cancelarEditarFechaSalida(): void {
    this.mostrarDialogFechaSalida = false;
    this.ordenSalidaSeleccionada = null;
    this.fechaSalidaEditada = new Date();
  }

  verificarRolUsuario(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.decodedToken = this.jwtHelper.decodeToken(token);

      const isRol1 = (r: any): boolean => {
        if (r === 1 || r === '1') {
          return true;
        }
        // formatos comunes cuando el rol viene como objeto
        return (
          r?.id === 1 || r?.id === '1' ||
          r?.Id === 1 || r?.Id === '1' ||
          r?.roleId === 1 || r?.roleId === '1' ||
          r?.RoleId === 1 || r?.RoleId === '1'
        );
      };

      const contieneRol1 = (rolesValue: any): boolean => {
        if (!rolesValue) {
          return false;
        }
        if (Array.isArray(rolesValue)) {
          return rolesValue.some(isRol1);
        }
        if (typeof rolesValue === 'string') {
          // por si viene como "1,2,3"
          return rolesValue.split(',').map(x => x.trim()).some(isRol1);
        }
        return isRol1(rolesValue);
      };
      
      // Buscar el rol en diferentes propiedades comunes del token JWT
      const roles = this.decodedToken.role || 
                    this.decodedToken.roles || 
                    this.decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                    this.decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
      
      // Verificar si el usuario tiene rol 1
      // Primero intentar desde el objeto user en localStorage
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const user = JSON.parse(userString);
          this.tieneRol1 = contieneRol1(user.roles) || contieneRol1(user.role);
        } catch (e) {
          console.error('Error al parsear user desde localStorage:', e);
        }
      }
      
      // Si no se encontró en localStorage, verificar en el token decodificado
      if (!this.tieneRol1) {
        this.tieneRol1 = contieneRol1(roles);
      }
    }
  }

  puedeEditar(rowData: any): boolean {
    // Si tiene rol 1, puede editar en todo momento
    if (this.tieneRol1) {
      return true;
    }
    // Si no es admin, solo puede editar si el estado es 'Planificado'
    return rowData?.nombreEstado === 'Planificado';
  }




}
