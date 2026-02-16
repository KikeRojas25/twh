import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ConfirmationService, MenuItem, SelectItem, MessageService     } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { SidebarModule } from 'primeng/sidebar';
import { DragDropModule } from 'primeng/dragdrop';

import { InventarioGeneral } from '../../_models/inventariogeneral';
import { GeneralService } from '../../_services/general.service';
import { InventarioService } from '../../_services/inventario.service';
import { Ubicacion } from '../../planning/planning.types';
import { OrdenRecibo } from '../../recepcion/recepcion.types';
import { Area } from '../../inventario/inventario.type';
import { AlmacenService } from '../../_services/almacen.service';
import { RecepcionService } from '../../recepcion/recepcion.service';
import { ReportesService } from '../../reportes/reportes.service';
import * as FileSaver from 'file-saver';


declare var $: any;

@Component({
  selector: 'app-acomodopallets',
  templateUrl: './acomodopallets.component.html',
  styleUrls: ['./acomodopallets.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ButtonModule, TableModule,
     DropdownModule, CalendarModule,
     InputNumberModule, InputTextModule, ToastModule, ConfirmDialogModule, TooltipModule, InputSwitchModule, 
     ToolbarModule, SidebarModule,DragDropModule],

  encapsulation: ViewEncapsulation.None,
  providers: [ConfirmationService, MessageService]  
})



export class AcomodopalletsComponent implements OnInit {

  condition: any = false;
  almacenID: number;

  public loading = false;
  EquipoTransporteId: any;
  ubicaciones: Ubicacion[];
  master: any ;

  model: any = {};
  modeldetail: any = {};
  inventarioTodos: any;
  inventarios: InventarioGeneral[] = [] ;
  inventario: InventarioGeneral;
  draggedInventario: InventarioGeneral;

  selectedInventarios: InventarioGeneral[] = [] ;
  visibleSidebar4 = false;
  activeIndex = 1;
  pasos: MenuItem[];
  orden: OrdenRecibo;
  areas_detail: Area[];
  id: any;
  cols: any[];
  Inventario: InventarioGeneral[] = [];
  areas: SelectItem[] = [];
  niveles: SelectItem[] = [];
  columnas: SelectItem[] = [];


  areaid: any;
  nivelid: any;




  constructor(   private inventarioServicio: InventarioService, private generalService: GeneralService
            , private activatedRoute: ActivatedRoute
            , private almacenService: AlmacenService
            ,private recepcionService: RecepcionService
            ,private reporteService: ReportesService
            ,private messageService: MessageService,
            private router: Router,
            private confirmationService: ConfirmationService) { }

  ngOnInit() {

    this.id  = this.activatedRoute.snapshot.params.uid;
    this.EquipoTransporteId = this.activatedRoute.snapshot.params.uid2;

    this.recepcionService.obtenerOrden(this.id).subscribe({
      next: (resp) => {
        this.orden = resp;
        console.log('orden', this.orden);
        this.almacenID = this.orden.almacenID;
      }
    });


    this.cols =
    [
        {header: 'LPN', field: 'lodNum'  ,  width: '50px' },
        {header: 'PRODUCTO', field: 'descripcionLarga'  , width: '100px'   },
        {header: 'Cantidad', field: 'untQty'  ,  width: '50px'  },
        {header: 'Ubicación', field: 'ubicacion' , width: '80px'  },
        {header: 'Próxima Ubicación', field: 'ubicacionProxima'  , width: '80px'  },

    ];



    this.generalService.getAreas().subscribe({
      next: (resp) => {
        this.areas_detail = resp;
        resp.forEach(element => {
          this.areas.push({
            value: element.id,
            label: element.nombre
          });
        });
      }
    });



      this.generalService.getNiveles().subscribe(resp =>
        {
          this.niveles.push({ label: 'Todos'  , value: undefined });

          resp.forEach(element => {
            this.niveles.push({
              value: element.id ,
              label:   element.descripcion
            });
          });
        });
        this.columnas.push({ label: 'Todos'  , value: undefined });
        for (let index = 1; index < 90; index++) {

          this.columnas.push({ label: index.toString()  , value: index });

        }




    this.inventarioServicio.GetAllInventarioByOrdenReciboId(this.id).subscribe({
      next: (resp) => {
        let sum = 0;
        let huella;

        console.log(resp);

        resp.forEach(element => {
          sum += element.untQty;
          huella = element.codigoHuella;
        });

        this.inventarios.push({
          lodNum : '[ Todas los Pallets ]',
          productoId : 1,
          descripcionLarga: '', cliente: '', codigoTWH: null, fechaProduccion: ''
          , cantidadSeparada: 0, stockDisponible: 0
          , unidadAlmacenamiento: null, fechaEsperada: ''
          , transportista: '', placa: '', pesoProducto: 0, chofer: '', unidadMedida: '', guiaRemision: '', tipoIngreso: '', tipoMerma: null, motivoMerma: null, areaMerma: null, oc: '', fechaRegistroMerma: '', razonSocial: '', destino: null, grupo: null, canal: null, proveedor: null, tipoUbicacion: '', volumen: 0, bultos: 0, pesoGuia: 0, contar: 0, bolsa: 0, observacion: '',
          untQty : sum
        });
        resp.forEach(element => {
          if (element.cantidad_productos > 1){
            element.descripcionLarga = 'Varios Productos';
            element.lotNum = 'Varios Lotes';
          }

          this.inventarios.push(element);
        });
      },
      error: (error) => {
        // Manejo de errores si es necesario
      },
      complete: () => {
        // Lógica de completado si es necesario
      }
    });
  }
onChange(value){
  this.loading = true;
  this.areaid = value.value;
  
  // Resetear los valores de nivel y columna al cambiar el área
  this.model.nivelId = undefined;
  this.model.ColumnaId = undefined;
  
  this.generalService.getAllUbicaciones(this.almacenID, value.value).subscribe({
    next: (list) => {
      console.log(list);
      this.loading = false;
      this.master = list;
    },
    error: (error) => {
      this.loading = false;
      console.error('Error al obtener ubicaciones:', error);
    }
  });
}

onChangeNivel(event){
  if (!this.areaid) {
    console.warn('Debe seleccionar un área primero');
    return;
  }

  this.loading = true;
  
  // Extraer el valor del evento - PrimeNG puede pasar el objeto completo o solo el valor
  let nivelValue = event.value;
  
  // Si el valor es un objeto con propiedad 'value', extraer solo el valor
  if (nivelValue && typeof nivelValue === 'object' && !Array.isArray(nivelValue) && 'value' in nivelValue) {
    nivelValue = nivelValue.value;
  }
  
  // Asegurar que nivelValue sea undefined si es null, vacío o undefined
  if (nivelValue === null || nivelValue === '') {
    nivelValue = undefined;
  }
  
  // Actualizar el modelo solo con el valor, no con el objeto completo
  this.model.nivelId = nivelValue;
  
  // Obtener columnaId del modelo, asegurándonos de que no sea un objeto
  let columnaValue = this.model.ColumnaId;
  if (columnaValue && typeof columnaValue === 'object' && !Array.isArray(columnaValue) && 'value' in columnaValue) {
    columnaValue = columnaValue.value;
    this.model.ColumnaId = columnaValue; // Actualizar también el modelo
  }
  
  // Convertir a string: vacío para "Todos" (undefined), string del número para valores específicos
  const nivelId: string = (nivelValue === undefined || nivelValue === null) ? '' : String(nivelValue);
  const columnaId: string = (columnaValue === undefined || columnaValue === null) ? '' : String(columnaValue);

  this.generalService.getAllUbicacionesxNivel(this.almacenID, this.areaid, nivelId, columnaId).subscribe({
    next: (list) => {
      this.loading = false;
      this.master = list;
    },
    error: (error) => {
      this.loading = false;
      console.error('Error al obtener ubicaciones por nivel:', error);
    }
  });
}

onChangeColumna(event){
  if (!this.areaid) {
    console.warn('Debe seleccionar un área primero');
    return;
  }

  this.loading = true;
  
  // Extraer el valor del evento - PrimeNG puede pasar el objeto completo o solo el valor
  let columnaValue = event.value;
  
  // Si el valor es un objeto con propiedad 'value', extraer solo el valor
  if (columnaValue && typeof columnaValue === 'object' && !Array.isArray(columnaValue) && 'value' in columnaValue) {
    columnaValue = columnaValue.value;
  }
  
  // Asegurar que columnaValue sea undefined si es null, vacío o undefined
  if (columnaValue === null || columnaValue === '') {
    columnaValue = undefined;
  }
  
  // Actualizar el modelo solo con el valor, no con el objeto completo
  this.model.ColumnaId = columnaValue;
  
  // Obtener nivelId del modelo, asegurándonos de que no sea un objeto
  let nivelValue = this.model.nivelId;
  if (nivelValue && typeof nivelValue === 'object' && !Array.isArray(nivelValue) && 'value' in nivelValue) {
    nivelValue = nivelValue.value;
    this.model.nivelId = nivelValue; // Actualizar también el modelo
  }
  
  // Convertir a string: vacío para "Todos" (undefined), string del número para valores específicos
  const columnaId: string = (columnaValue === undefined || columnaValue === null) ? '' : String(columnaValue);
  const nivelId: string = (nivelValue === undefined || nivelValue === null) ? '' : String(nivelValue);

  this.generalService.getAllUbicacionesxColumna(this.almacenID, this.areaid, columnaId, nivelId).subscribe({
    next: (list) => {
      this.loading = false;
      this.master = list;
    },
    error: (error) => {
      this.loading = false;
      console.error('Error al obtener ubicaciones por columna:', error);
    }
  });
}

identificar(id){
  this.inventarioServicio.get(id).subscribe({
    next: (resp) => {
      this.modeldetail = resp;
      $('html,body').animate({ scrollTop: 2500 }, 'slow');
    }
  });
}


onAsignarYTerminar() {
  // Mostrar confirmación antes de ejecutar la acción
  this.confirmationService.confirm({
    message: '¿Está seguro que desea guardar las ubicaciones y terminar el acomodo?',
    header: 'Confirmar acción',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, guardar',
    rejectLabel: 'Cancelar',
    accept: () => {
      // Usuario confirmó, proceder con la acción
      this.ejecutarAsignarYTerminar();
    },
    reject: () => {
      // Usuario canceló, no hacer nada
    }
  });
}

ejecutarAsignarYTerminar() {
  this.loading = true;
  
  // Validar que haya inventarios seleccionados
  if (!this.selectedInventarios || this.selectedInventarios.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay inventarios seleccionados para asignar ubicaciones.'
    });
    this.loading = false;
    return;
  }

  // Filtrar los inventarios excluyendo el elemento especial "Todas los Pallets" (productoId === 1)
  // Este elemento es solo visual y no debe enviarse al API
  this.inventarioTodos = this.selectedInventarios.filter(x => x.productoId !== 1);

  // Validar que después del filtrado haya items válidos
  if (!this.inventarioTodos || this.inventarioTodos.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay inventarios válidos para asignar. Solo se puede usar la opción "Todas los Pallets" si hay otros items seleccionados.'
    });
    this.loading = false;
    return;
  }

  // Verificar que todos los inventarios tengan ubicacionId asignado
  const inventariosSinUbicacion = this.inventarioTodos.filter(x => !x.ubicacionId);
  if (inventariosSinUbicacion.length > 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Hay ${inventariosSinUbicacion.length} inventario(s) sin ubicación asignada. Por favor, arrastre todos los items a una ubicación antes de guardar.`
    });
    this.loading = false;
    return;
  }

  console.log('📦 Inventarios a enviar al API:', this.inventarioTodos);
  console.log('📍 Total de items:', this.inventarioTodos.length);

  const ordenReciboId = this.id;

  // Enviar inventarioTodos (filtrado) en lugar de selectedInventarios
  this.inventarioServicio.asignarYTerminarAcomodo(this.inventarioTodos, ordenReciboId)
    .subscribe({
      next: (response) => {
        console.log('✅ Operación completada:', response);

        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Operación completada',
          detail: 'Ubicaciones asignadas y acomodo terminado correctamente'
        });

        // Instrucción de acomodo (PDF vía API para evitar mixed-content HTTP/HTTPS)
        this.reporteService.exportarInstruccionAcomodoPdf(String(this.id)).subscribe({
          next: (res) => {
            const contentDisposition = res.headers?.get('content-disposition') || res.headers?.get('Content-Disposition');
            const fileName = this.getFilenameFromContentDisposition(contentDisposition) ?? 'InstruccionAcomodo.pdf';
            const blob = res.body ?? new Blob([], { type: 'application/pdf' });
            FileSaver.saveAs(blob, fileName);
          },
          error: (err) => {
            const fallbackMsg = 'No se pudo descargar la instrucción de acomodo (PDF).';
            if (err?.error instanceof Blob) {
              err.error.text().then((t: string) => {
                try {
                  const j = JSON.parse(t);
                  this.messageService.add({ severity: 'error', summary: 'Error', detail: j?.message ?? fallbackMsg });
                } catch {
                  this.messageService.add({ severity: 'error', summary: 'Error', detail: fallbackMsg });
                }
              }).catch(() => this.messageService.add({ severity: 'error', summary: 'Error', detail: fallbackMsg }));
              return;
            }
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? fallbackMsg });
          }
        });

        // Redireccionar con delay de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/recibo/equipotransporteentrante'], { 
            queryParams: { equipoTransporteId: this.EquipoTransporteId } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error:', error);
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || error?.message || 'Ocurrió un error al guardar las ubicaciones'
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
}



// asignarUbicacion(){

//   this.loading = true;



//   this.inventarioServicio.asignar_ubicacion(this.inventarioTodos).subscribe({
//     next: (resp) => {
//       // Lógica de éxito si es necesario
//     },
//     error: (error) => {
//       //error(error);
//     },
//     complete: () => {
//       this.terminar();
//     }
//   });
//  }

// terminar() {
//   this.inventarioServicio.terminar_acomodo(this.id).subscribe({
//     next: (resp) => {


//     //success('Se ha realizado el acomodo de las pallets con éxito.');







//     },
//     error: (error) => {
//       if (error === 'Err101') {
//         //error('Aún tiene pallets pendientes de acomodo.');
//       }
//       //error(error);
//     },
//     complete: () => {
//       this.loading = false;
//     }
//   });
//  }


  select_ubicacion(i){

    if (this.condition) {
      this.condition = false;
    }
    else {
      this.condition = true;
    }
  }

  private getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(contentDisposition);
    if (!match?.[1]) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  drop(event) {

    let dragged = this.draggedInventario;

    if(event.estado === 'Lleno')
    {



      this.confirmationService.confirm({
        message: '¿Esta ubicación esta ocupada, desea continuar?',
        accept: () => {
          this.preAsignar(event,dragged);
        }

      });
    }
    else
    {
      this.preAsignar(event,dragged);
    }


  }
  preAsignar(event, dragged){


     this.draggedInventario = dragged;

    if (dragged) {
      this.draggedInventario.ubicacionId = event.id;

      if (this.draggedInventario.productoId === 1) {
        this.inventarios.forEach(element => {
            element.ubicacionId = event.id;
            this.selectedInventarios.push(element);
        });
        this.inventarios = null;
        //success('Se agregaron las pallets a la ubicación seleccionada');
      }
      else {

        const draggedCarIndex = this.findIndex(this.draggedInventario);


        this.selectedInventarios = [...this.selectedInventarios, this.draggedInventario ];
        this.inventarios = this.inventarios.filter((val, i) => i !== draggedCarIndex);
        this.draggedInventario = null;

        if (this.inventarios.length === 1){
           if (this.inventarios[0].productoId === 1) {
            this.inventarios = null;
           }
        }
        if(event.estado === 'Parcial'){

        }
        else {
            event.estado = 'Lleno';
        }

        //success('Se agregó la pallet a la ubicación seleccionada');
       }
      }

   }
  dragStart(event, inventario: InventarioGeneral) {
    this.draggedInventario = inventario;
  }
  dragEnd(event) {
    this.draggedInventario = null;
  }
  findIndex(car: InventarioGeneral) {
    let index = -1;
    for (let i = 0; i < this.inventarios.length; i++) {
        if (car.lodNum === this.inventarios[i].lodNum) {
            index = i;
            break;
        }
    }
    return index;
    }
    deshacer(){


      this.selectedInventarios = null;
      this.inventarios = [];
      this.selectedInventarios = [];

      this.inventarioServicio.GetAllInventarioByOrdenReciboId(this.id).subscribe({
        next: (resp) => {
          let sum = 0;
          let huella;
          resp.forEach(element => {
            sum += element.untQty;
            huella = element.codigoHuella;
          });

          this.inventarios.push({
            lodNum : '[ Todas los Pallets ]',
            productoId : 1,
            descripcionLarga: '', cliente: '', 
            codigoTWH: null, fechaProduccion: '', 
            cantidadSeparada: 0, stockDisponible: 0, 
            unidadAlmacenamiento: null, 
            fechaEsperada: '', transportista: '', placa: '', 
            pesoProducto: 0, chofer: '', unidadMedida: '', guiaRemision: '', 
            tipoIngreso: '', tipoMerma: null, motivoMerma: null, areaMerma: null, oc: '', 
            fechaRegistroMerma: '', razonSocial: '', destino: null, grupo: null, canal: null, 
            proveedor: null, tipoUbicacion: '', volumen: 0, bultos: 0, pesoGuia: 0, 
            contar: 0, bolsa: 0, observacion: '',
            untQty : sum
          });
          resp.forEach(element => {
            if (element.cantidad_productos > 1){
              element.descripcionLarga = 'Varios Productos';
              element.lotNum = 'Varios Lotes';
            }

            this.inventarios.push(element);
          });
        },
        error: (error) => {
          // Manejo de errores si es necesario
        },
        complete: () => {
          this.master = [];
          // this.generalService.getAllUbicaciones(this.almacenId, this.areaid, this.nivelid, this.model.ColumnaId ).subscribe(list => {
          //       this.master = list;
          // });
        }
      });


    }
}
