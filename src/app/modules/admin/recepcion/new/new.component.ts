import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { GeneralService } from '../../_services/general.service';
import { MantenimientoService } from '../../mantenimientos/mantenimiento.service';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AlmacenService } from '../../_services/almacen.service';
import { ClienteService } from '../../_services/cliente.service';
import { DespachosService } from '../../despachos/despachos.service';
import { PanelModule } from 'primeng/panel';
import { RecepcionService } from '../recepcion.service';
import { finalize } from 'rxjs';
import { PropietarioService } from '../../_services/propietario.service';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone:true,
      imports: [
            InputTextModule,
            DropdownModule,
            FormsModule,
            ButtonModule,
            TableModule,
            CommonModule,
            DialogModule,
            DynamicDialogModule,
            ToastModule,
            CalendarModule,
            ConfirmDialogModule,
            MatIcon,
            IconFieldModule,
            InputIconModule,
            InputMaskModule,
            InputNumberModule,
            PanelModule,
            ReactiveFormsModule,
            SkeletonModule
          ],
          providers: [
            MessageService ,
            ConfirmationService     
          ]
})
export class NewComponent implements OnInit {

  form: FormGroup;
  loading = false;
  cargandoCombos = true;

  propietarios: SelectItem[] = [];
  tiposingreso  : SelectItem[] = [];
  almacenes: SelectItem[] = [];
  destinos: SelectItem[] = [];
  tipodescarga: SelectItem[] = [];

  agregados: any[]  = [];

  jwtHelper = new JwtHelperService();
  decodedToken: any = {};



  es = {
    firstDayOfWeek: 1,
    dayNames: [ 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado' ],
    dayNamesShort: [ 'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb' ],
    dayNamesMin: [ 'D', 'L', 'M', 'X', 'J', 'V', 'S' ],
    monthNames: [ 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre' ],
    monthNamesShort: [ 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic' ],
    today: 'Hoy',
    clear: 'Borrar'
};



  model: any = {}

  constructor(   
    private ref: DynamicDialogRef,
    public dialogService: DialogService,
    private almacenService: AlmacenService,
    private clienteService: ClienteService,
    private propietarioService: PropietarioService,
    private confirmationService: ConfirmationService ,
    private generalService: GeneralService,
    private recepcionService: RecepcionService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private router: Router) { 


      this.form = this.fb.group({
        // Obligatorios
        almacenId:     [null, Validators.required],
        propietarioId: [null, Validators.required],
        fechaEsperada: [new Date(), Validators.required],
        horaEsperada:  ['15:00', Validators.required],
        IdTipoIngreso: [null, Validators.required],
        ordenCompra:   ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
        guiaRemision:  ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],

        // Opcionales (sin Validators.required)
        destino:   [null],
        cantidad:  [null, [Validators.min(1), Validators.max(100000)]],
        peso:      [null, [Validators.min(0.01), Validators.max(100000)]],
        volumen:   [null, [Validators.min(0.01), Validators.max(100000)]],
        proveedor: ['', [Validators.minLength(5), Validators.maxLength(50)]],
        entrega:   ['', [Validators.minLength(5), Validators.maxLength(50)]],
      });


    }

  ngOnInit() {
    this.cargarCombos();

    this.model.horaEsperada = '15:00';

    
    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);




   
  }
  cargarCombos(){
    this.cargandoCombos = true;
    forkJoin([
      this.propietarioService.getAllPropietarios(),
      this.almacenService.getAllAlmacenes(),
      this.generalService.getValorTabla(31),
      this.generalService.getValorTabla(31)
    ]).subscribe({
      next: ([propResp, almacResp, tipoIngResp, tipoDescResp]) => {
        this.propietarios  = (propResp ?? []).map((p: any) => ({ value: p.id, label: p.razonSocial }));
        this.almacenes     = (almacResp ?? []).map((a: any) => ({ value: a.id, label: a.descripcion }));
        this.tiposingreso  = (tipoIngResp ?? []).map((t: any) => ({ value: t.id, label: t.valorPrincipal }));
        this.tipodescarga  = (tipoDescResp ?? []).map((t: any) => ({ value: t.id, label: t.valorPrincipal }));
        this.cargandoCombos = false;
      },
      error: () => {
        this.cargandoCombos = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del formulario.' });
      }
    });
  }

//   onChangePropietario(propietario) {
//     console.log(propietario);

//     this.tiposingreso = [];

//     this.clienteService.getAllClientesxPropietarios(propietario.value).subscribe(resp => {
      
    
//       this.clientes = resp.map(element => ({
//         value: element.id, 
//         label: element.razonSocial
//       })
    
//     );
//         // Verifica si hay solo un cliente en la lista
//         if (this.clientes.length === 1) {
//           const clienteUnico = this.clientes[0];

//           // Asigna el único cliente al formulario
//           this.form.get('clienteId').setValue(clienteUnico.value);

//           // Llama a la función onChangeCliente con el cliente seleccionado
//           this.onChangeCliente(clienteUnico);
//         }

//   });
// }

  
//   onChangeCliente(cliente){
//     this.direcciones = [];

//     this.clienteService.getAllDirecciones(cliente.value).subscribe(resp => {
//       this.direcciones = resp.map(element => ({
//         value: element.iddireccion,
//         label: `${element.direccion} [ ${element.departamento} - ${element.provincia} - ${element.distrito} ]`
//       }));

//      // Verifica si hay solo una dirección en la lista
//      if (this.direcciones.length === 1) {
//       // Si es así, selecciona esa dirección automáticamente
//       this.form.get('direccionId').setValue(this.direcciones[0].value);
//     }
//   });
// }
 /** True si el control existe, fue tocado/dirty y tiene un error puntual. */
  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c && (c.touched || c.dirty) && c.hasError(error));
  }

  /** True si el control es inválido y ya fue tocado o modificado. */
  isInvalid(control: string): boolean {
    const c = this.form.get(control);
    return !!(c && (c.touched || c.dirty) && c.invalid);
  }

 registrar() {
    if (this.form.invalid) {
      // Marcar todos como tocados → muestra TODOS los errores al hacer click
      // en Guardar (no solo los del campo que el usuario tocó). Patrón estándar.
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa los campos obligatorios marcados con *.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea agregar la ORI?',
      header: 'Agregar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const v = this.form.value;

        const model: any = {
          almacenId: v.almacenId,
          propietario: this.propietarios.find(x => x.value === v.propietarioId)?.label ?? null,
          propietarioId: v.propietarioId,
          fechaEsperada: v.fechaEsperada,
          horaEsperada: v.horaEsperada,
          tipoIngresoId: v.IdTipoIngreso,
          destino: v.destino,
          oc: v.ordenCompra,
          guiaRemision: v.guiaRemision,
          cantidad: v.cantidad,
          peso: v.peso,
          volumen: v.volumen,
          proveedor: v.proveedor,
          entrega: v.entrega,
          usuarioId: this.decodedToken.nameid,
          usuarioid: this.decodedToken.nameid
        };

        this.loading = true;
        this.recepcionService
          .registrar(model)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (resp) => {
              // ✅ Cierra y devuelve un payload al padre (éxito)
              this.ref.close({ ok: true, data: resp });
            },
            error: (err) => {
              // ❌ NO cerramos el modal: mostramos el mensaje y dejamos que el
              //    usuario corrija (típicamente la guía duplicada).
              const detalle =
                (typeof err === 'string' ? err : null) ??
                err?.error?.message ??
                err?.message ??
                'No se pudo registrar la ORI.';

              const esGuiaDuplicada = /gu[ií]a/i.test(detalle) && /existe|registrad/i.test(detalle);
              if (esGuiaDuplicada) {
                // Marca el campo guiaRemision como inválido visualmente.
                this.form.get('guiaRemision')?.setErrors({ duplicada: true });
                this.form.get('guiaRemision')?.markAsTouched();
              }

              this.messageService.add({
                severity: 'warn',
                summary: 'No se pudo guardar',
                detail: detalle,
                life: 6000
              });
            }
          });
      }
    });
  }

  cancelar() {
    this.ref?.close();
  }

  onChangePropietario(propietario) {
  

    this.destinos = [];

    this.recepcionService.getAllDestinosPalmas(propietario.value).subscribe(resp => {
      
    
      this.destinos = resp.map(element => ({
        value: element.id, 
        label: element.razonSocial
      })
    
    );
        // Verifica si hay solo un cliente en la lista
        if (this.destinos.length === 1) {
          const clienteUnico = this.destinos[0];

          // Asigna el único cliente al formulario
          this.form.get('clienteId').setValue(clienteUnico.value);

          // Llama a la función onChangeCliente con el cliente seleccionado
         
        }

  });
}


  deleteOrder(id){
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
  
            this.recepcionService.deleteOrder(id).subscribe(x=> {
  
              const index = this.agregados.findIndex(item => item.id === id);

              // Verifica si el elemento existe en la lista
              if (index !== -1) {
                this.agregados.splice(index, 1); // Elimina 1 elemento desde el índice encontrado
              }


              this.messageService.add({severity: 'success', summary: 'TWH', detail: 'Se eliminó correctamente.'})  //success('Se registró correctamente.');
            })
  
      },
      reject: () => {
  
      }
    });
  
  }
}
