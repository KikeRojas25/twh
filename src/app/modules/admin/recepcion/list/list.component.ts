import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { DynamicDialogRef, DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MatIcon } from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { OrdenRecibo } from '../recepcion.types';
import { RecepcionService } from '../recepcion.service';
import { GeneralService } from '../../_services/general.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { NewComponent } from '../new/new.component';
import { NewdetailsComponent } from '../newdetails/newdetails.component';
import { AsignarPlacaRecepcionComponent } from '../asignar-placa/asignar-placa-recepcion.component';
import { EditComponent } from '../edit/edit.component';
import { PropietarioService } from '../../_services/propietario.service';


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
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
    MatIcon
  ],
  providers: [
    DialogService ,
    MessageService ,
    ConfirmationService

  ]
})
export class ListComponent implements OnInit {

  cols: any[];



  dateInicio: Date = new Date(Date.now() ) ;
  dateFin: Date = new Date(Date.now()) ;
  es: any;
  public loading = false;
  ordenes: OrdenRecibo[] = [];
  model: any;
  EstadoId: number;
  selectedRow: OrdenRecibo;

  mostrarEdicionMasiva: boolean;

  clientes: SelectItem[] = [];
  selectedCar2 = 'NESTLE S.A.';
  titularAlerta  = '';
  listData = {};
  mostrarPopup= false;
  placas : SelectItem[];
tipoingreso: SelectItem[] = [];



  estados: SelectItem[] = [
      {value: undefined, label: 'Todos'},
      {value: 4, label: 'Planificado'},
      {value: 5, label: 'Asignado'},
      {value: 6, label: 'Recibiendo'},
      {value: 19, label: 'Pendiente Acomodo'},
      {value: 20, label: 'Pendiente Almacenamiento'},
      {value: 12, label: 'Almacenado'},

  ];
  almacenes: SelectItem[] = [];
  ref: DynamicDialogRef | undefined;


  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  supervisor = false;
  esAdministrador = false;
  tieneRol1 = false;

  constructor(private ordenreciboService: RecepcionService,
              private router: Router,
              private propietarioService: PropietarioService,
              private messageService: MessageService,
              public dialogService: DialogService,
              private generalService: GeneralService,
              private confirmationService: ConfirmationService
   ) { }



   compareFn: ((f1: any, f2: any) => boolean) | null = this.compareByValue;

   compareByValue(f1: any, f2: any) {
     return f1 && f2 && f1.value === f2.value;
   }


  ngOnInit() {

    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);

    const supervisorIds = ['95', '30','126', ]; 
    this.supervisor = supervisorIds.includes(this.decodedToken.nameid);

    // Verificar si el usuario es administrador
    // Buscar el rol en diferentes propiedades comunes del token JWT
    const roles = this.decodedToken.role || 
                  this.decodedToken.roles || 
                  this.decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                  this.decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
    
    if (Array.isArray(roles)) {
      this.esAdministrador = roles.some((r: string) => 
        r.toLowerCase().includes('admin') || r.toLowerCase().includes('administrador')
      );
    } else if (typeof roles === 'string') {
      this.esAdministrador = roles.toLowerCase().includes('admin') || 
                             roles.toLowerCase().includes('administrador');
    }
    
    // Verificar si el usuario tiene rol 1
    // Primero intentar desde el objeto user en localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.roles && Array.isArray(user.roles)) {
          this.tieneRol1 = user.roles.includes(1);
        } else if (user.roles === 1 || user.role === 1) {
          this.tieneRol1 = true;
        }
      } catch (e) {
        console.error('Error al parsear user desde localStorage:', e);
      }
    }
    
    // Si no se encontró en localStorage, verificar en el token decodificado
    if (!this.tieneRol1) {
      if (Array.isArray(roles)) {
        this.tieneRol1 = roles.includes(1) || roles.some((r: any) => r === 1 || r === '1');
      } else if (roles === 1 || roles === '1') {
        this.tieneRol1 = true;
      }
    }
    
    // Si no se encuentra en el token, verificar por IDs específicos (similar a supervisor)
    // Puedes agregar IDs de administradores aquí si es necesario
    // const adminIds = ['1', '2']; // Ejemplo
    // if (!this.esAdministrador) {
    //   this.esAdministrador = adminIds.includes(this.decodedToken.nameid);
    // }


    const almacenGuardado = localStorage.getItem('almacen');
    const propietarioGuardado = localStorage.getItem('propietario');





    this.model = {};





    this.dateInicio.setDate((new Date()).getDate() - 2);
    this.dateFin.setDate((new Date()).getDate() );

    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;



    // localStorage.getItem('dateFin', this.dateFin.toDateString());

    this.es = {
      firstDayOfWeek: 1,
      dayNames: [ 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado' ],
      dayNamesShort: [ 'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb' ],
      dayNamesMin: [ 'D', 'L', 'M', 'X', 'J', 'V', 'S' ],
      monthNames: [ 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre' ],
      monthNamesShort: [ 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic' ],
      today: 'Hoy',
      clear: 'Borrar'
  };


    this.cols =
    [
        {header: 'ACCIONES', field: 'numOrden' , width: '140px' },
        {header: 'ORDEN', field: 'numOrden'  ,  width: '80px' },
        {header: 'ALMACÉN', field: 'almacen'  ,  width: '120px' },
        {header: 'PROPIETARIO', field: 'propietario'  , width: '140px'   },
        {header: 'ESTADO', field: 'nombreEstado'  ,  width: '100px'  },
        {header: 'GR', field: 'guiaRemision' , width: '100px'  },
        {header: 'EQ TRANSP', field: 'equipotransporte'  , width: '140px'  },
        {header: 'F. ESPERADA', field: 'fechaEsperada'  , width: '130px'  },
        {header: 'USUARIO REGISTRO', field: 'fechaEsperada'  , width: '130px'  },
        {header: 'F. REGISTRO', field: 'fechaRegistro', width: '120px'    },

      ];



             this.generalService.getAllAlmacenes().subscribe(resp => {
             this.almacenes.push({ label: "Todos" , value: undefined });
            resp.forEach(element => {
              this.almacenes.push({ value: element.id ,  label : element.descripcion});
            });

            this.propietarioService.getAllPropietarios().subscribe(resp1 => {
              this.clientes.push({ label: "Todos" , value: undefined });
            resp1.forEach(element => {
              this.clientes.push({ label: element.razonSocial.toUpperCase() , value: element.id });
            });

      }, error=> {

      }  , () => {

        if (almacenGuardado) {
          this.model.AlmacenId = parseInt  (almacenGuardado)
        }

        if (propietarioGuardado) {
          this.model.PropietarioId =parseInt( propietarioGuardado);
        }

      console.log(   this.model);

          this.buscar();
      });

    });
  }


   ver(idOrdenRecepcion){
  //  this.router.navigate(['/recibo/verordenrecibo', id]);



    this.dialogService.open(NewdetailsComponent, {
        header: 'Ver Detalle',
        width: '80%',
        data: {
          idOrdenRecepcion: idOrdenRecepcion
        }
      });


   }

  asignartransporte() {

    console.log('seleccinados' ,this.selectedRow);

    if (!this.selectedRow) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Advertencia', 
        detail: 'Seleccione una orden de recibo.' 
      });
      return;
    }

    this.ref = this.dialogService.open(AsignarPlacaRecepcionComponent, {
      header: `Asignar Placa`,
      width: '70%',
      data: {
        id: this.selectedRow.ordenReciboId   // 🔹 pasamos el id en array
      },
    });

    this.ref.onClose.subscribe((selectedDriver) => {
      if (selectedDriver) {


        this.buscar(); // Refresca la lista después de asignar el conductor

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Programación guardada correctamente'
        });
      }
    });
  }


   nuevo() {




        this.ref = this.dialogService.open(NewComponent, {
          header: 'Nueva ORI',
             width: '1000px',
            height: '900px',
            data: {
            }

      });
      this.ref.onClose.subscribe((result: any) => {
          if (!result) return; // cerrado sin acción

          if (result.ok) {
            // ✅ Notificación en el padre
            const num = result.data?.numOrden ?? '';
            this.messageService.add({
              severity: 'success',
              summary: 'TWH',
              detail: `Se registró correctamente${num ? ` (N° ${num})` : ''}.`
            });
            // refresca tablas/listas, etc.
            this.buscar();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'TWH',
              detail: result.error || 'No se pudo registrar la ORI.'
            });
          }
        });



//    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data Saved' });
}

update() {
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Data Updated' });
}



   guardarEdicion(){


    this.model.id = this.model.ordenReciboId;


    this.confirmationService.confirm({
      message: '¿Está seguro que desea actualizar el ingreso? Recuerda que si la ORI está almacenada, impactará en el Kardex.',
      header: 'Actualizar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {



        this.ordenreciboService.actualizar(this.model).subscribe(resp => {

          this. messageService.add({severity: 'success', summary: 'TWH', detail: 'La ORI ha sido actualizada.'});
          this.mostrarEdicionMasiva  = false;
          this.buscar();

      });

      reject: () => {

      }
    }
   });
   }
   edit(id){
    // Buscar la orden para verificar el estado
    const orden = this.ordenes.find(o => o.ordenReciboId === id);
    
    if (!orden) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la orden de recibo.'
      });
      return;
    }

    // Validar si se puede editar
    if (!this.puedeEditar(orden)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Solo se puede editar órdenes en estado Planificado o si eres administrador.'
      });
      return;
    }

    // this.mostrarEdicionMasiva  = true;

    

        this.ref = this.dialogService.open(EditComponent, {
          header: 'Editar ORI',
             width: '1000px',
            height: '900px',
            data: { id
            }

      });
      this.ref.onClose.subscribe((result: any) => {
          if (!result) return; // cerrado sin acción

          if (result.ok) {
          
            const num = result.data?.numOrden ?? '';
            this.messageService.add({
              severity: 'success',
              summary: 'TWH',
              detail: `Se registró correctamente${num ? ` (N° ${num})` : ''}.`
            });
            // refresca tablas/listas, etc.
            this.buscar();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'TWH',
              detail: result.error || 'No se pudo registrar la ORI.'
            });
          }
        });


    // console.log(this.model);

    // this.generalService.getValorTabla(31).subscribe(resp => {
    //      resp.forEach(x=> {
    //       this.tipoingreso.push({value: x.id , label: x.valorPrincipal });
    //      });



    //      this.ordenreciboService.obtenerOrden(id).subscribe(resp => {
    //       this.model = resp;

    //        // Convertir la fecha a un objeto Date
    //       if (this.model.fechaEsperada) {
    //         this.model.fechaEsperada = new Date(this.model.fechaEsperada);
    //       }



    //       console.log(this.model);
    //     });


    // })



     //this.router.navigate(['/recibo/editarordenrecibo', id]);
   }
   nuevaordenmasiva() {
    this.router.navigate(['/recibo/nuevaordenmasiva']);

   }
   delete(id){
    // Buscar la orden para verificar el estado
    const orden = this.ordenes.find(o => o.ordenReciboId === id);
    
    if (!orden) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la orden de recibo.'
      });
      return;
    }

    // Validar si se puede eliminar
    if (!this.puedeEliminar(orden)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Solo se puede eliminar órdenes en estado Planificado o si eres administrador.'
      });
      return;
    }


    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar la ORI?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {

        this.ordenreciboService.deleteOrder(id).subscribe(resp =>
           {this.messageService.add({ severity: 'success', summary: 'TWH', detail: 'La orden fue eliminada correctamente.' });

          this.ordenreciboService.getAll(this.model).subscribe(list => {
                this.ordenes = list;
          });
           }, error => {
            if (error === 'err020') {
              //this.messageService.add('Esta Orden de Recibo tiene productos asociados.');
              this.messageService.add({ severity: 'danger', summary: 'Success', detail: 'Esta Orden de Recibo tiene productos asociados.' });
            }
            else {
             // this.messageService.add('Ocurrió un error inesperado.');
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Ocurrió un error inesperado.' });
            }
            }, () => {
            });




      },
      reject: () => {

      },



   });
  }

   equipotransporte(){






    if(this.selectedRow.estadoID === 4){
      this.router.navigate(['/recibo/vincularequipotransporte', ''] );
    }
    else {
      this. messageService.add({severity: 'error', summary: 'TWH', detail: 'La orden ya fue asignada.'})  //error('La orden ya fue asignada');
    }


   }
   openDoor(id) {
    this.router.navigate(['/recibo/asignarpuerta', id]);
   }
   buscar(){


  // Guardar en Local Storage cuando se haga clic en "Buscar"
  if (this.model.AlmacenId) {
      localStorage.setItem('almacen', this.model.AlmacenId);
    }

    if (this.model.PropietarioId) {
      localStorage.setItem('propietario', this.model.PropietarioId);
    }


    this.model.fec_ini =  this.dateInicio;
    this.model.fec_fin =  this.dateFin ;

    this.ordenreciboService.getAll(this.model).subscribe(list => {
    this.ordenes = list;



    }, error => {
    } );
   }
   editarordenes() {
    this.mostrarEdicionMasiva  = true;
   }

  /**
   * Verifica si se puede editar una orden
   * Solo se puede editar si el estado es "Planificado" (4), si el usuario es administrador, o si tiene rol 1
   */
  puedeEditar(orden: OrdenRecibo): boolean {
    const estadoPlanificado = 4;
    // Si tiene rol 1, siempre puede editar
    if (this.tieneRol1) {
      return true;
    }
    return orden.estadoID === estadoPlanificado || this.esAdministrador;
  }

  /**
   * Verifica si se puede eliminar una orden
   * Solo se puede eliminar si el estado es "Planificado" (4), si el usuario es administrador, o si tiene rol 1
   */
  puedeEliminar(orden: OrdenRecibo): boolean {
    const estadoPlanificado = 4;
    // Si tiene rol 1, siempre puede eliminar
    if (this.tieneRol1) {
      return true;
    }
    return orden.estadoID === estadoPlanificado || this.esAdministrador;
  }


}
