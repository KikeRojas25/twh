  import { Component, OnInit } from '@angular/core';
  import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
  import { JwtHelperService } from '@auth0/angular-jwt';
  import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
  import { DialogService, DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
  import { AlmacenService } from '../../_services/almacen.service';
  import { Router } from '@angular/router';
  import { finalize } from 'rxjs';
  import { ClienteService } from '../../_services/cliente.service';
  import { GeneralService } from '../../_services/general.service';
  import { RecepcionService } from '../recepcion.service';
  import { CommonModule } from '@angular/common';
  import { MatIcon } from '@angular/material/icon';
  import { ButtonModule } from 'primeng/button';
  import { CalendarModule } from 'primeng/calendar';
  import { ConfirmDialogModule } from 'primeng/confirmdialog';
  import { DialogModule } from 'primeng/dialog';
  import { DropdownModule } from 'primeng/dropdown';
  import { IconFieldModule } from 'primeng/iconfield';
  import { InputIconModule } from 'primeng/inputicon';
  import { InputMaskModule } from 'primeng/inputmask';
  import { InputNumberModule } from 'primeng/inputnumber';
  import { InputTextModule } from 'primeng/inputtext';
  import { PanelModule } from 'primeng/panel';
  import { TableModule } from 'primeng/table';
  import { ToastModule } from 'primeng/toast';

  @Component({
    selector: 'app-edit',
    templateUrl: './edit.component.html',
    styleUrls: ['./edit.component.css'],
    standalone:true,
          imports: [
                InputTextModule, 
                DropdownModule,
                FormsModule,
                ButtonModule,
                TableModule,
                CommonModule,
                DialogModule   ,
                DynamicDialogModule ,
                ToastModule,
                CalendarModule,
                ConfirmDialogModule,
                MatIcon,
                IconFieldModule,
                InputIconModule,
                InputMaskModule ,
                InputNumberModule,
                PanelModule,
                ReactiveFormsModule
              ],
              providers: [
                MessageService ,
                ConfirmationService     
              ]
  })
  export class EditComponent implements OnInit {

    form: FormGroup;
    loading = false;

    
    propietarios: SelectItem[] = [];
    tiposingreso  : SelectItem[] = [];
    almacenes: SelectItem[] = [];
    destinos: SelectItem[] = [];
    tipodescarga: SelectItem[] = [];

    agregados: any[]  = [];

    jwtHelper = new JwtHelperService();
    decodedToken: any = {};

    id!: number;

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
      private confirmationService: ConfirmationService ,
      private generalService: GeneralService,
      private recepcionService: RecepcionService,
      private messageService: MessageService,
      private fb: FormBuilder,
      public config: DynamicDialogConfig,
      private router: Router) { 


        this.form = this.fb.group({
          almacenId: [null, Validators.required],
          propietarioId: [null, Validators.required],
          fechaEsperada: [ new Date(), Validators.required],
          horaEsperada: ['15:00', Validators.required],
          IdTipoIngreso: [null, Validators.required],
          destino : [null, ],
          ordenCompra: ['', [Validators.minLength(5), Validators.maxLength(20),Validators.required]],
          guiaRemision: ['', [Validators.minLength(5), Validators.maxLength(50), Validators.required]],
          cantidad:         [
            null, 
            [, Validators.min(1), Validators.max(100000)]
          ],
          peso:             [
            null, 
            [, Validators.min(0.01), Validators.max(100000)]
          ],
          volumen:          [
            null, 
            [ Validators.min(0.01), Validators.max(100000)]
          ],

          proveedor: ['', [Validators.minLength(5), Validators.maxLength(50)]],
          entrega: ['', [Validators.minLength(5), Validators.maxLength(50)]],
        });


        this.id = this.config.data.id;

      }

    ngOnInit() {
      this.cargarCombos();

      this.model.horaEsperada = '15:00';

      
      const user  = localStorage.getItem('token');
      this.decodedToken = this.jwtHelper.decodeToken(user);

          this.recepcionService.obtenerOrden(this.id).subscribe(resp => {
            this.model = resp;

            // Convertir la fecha a un objeto Date
            if (this.model.fechaEsperada) {
              this.model.fechaEsperada = new Date(this.model.fechaEsperada);
            }

              // convertir hora "HH:mm:ss" a "HH:mm"
  let horaFormateada: string | null = null;
  if (this.model.horaEsperada) {
    const partes = this.model.horaEsperada.split(':');
    if (partes.length >= 2) {
      horaFormateada = `${partes[0]}:${partes[1]}`; // "10:00"
    }
  }



        this.form.patchValue({
          almacenId: this.model.almacenID,
          propietarioId: this.model.propietarioID,
          fechaEsperada: this.model.fechaEsperada,
          horaEsperada: horaFormateada,
          IdTipoIngreso: this.model.tipoIngresoId, // 👈 asegúrate que el control también sea tipoIngresoId o cambialo aquí
          destino: this.model.destino,
          ordenCompra: this.model.numOrden,
          guiaRemision: this.model.guiaRemision,
          cantidad: this.model.cantidad ?? null,
          peso: this.model.peso ?? null,
          volumen: this.model.volumen ?? null,
          proveedor: this.model.proveedor,
          entrega: this.model.chofer
        });




            console.log(this.model);
          });


    
    }
    cargarCombos(){

      this.clienteService.getAllPropietarios('').subscribe(resp => {
        resp.forEach(resp => {
          this.propietarios.push({value: resp.id , label: resp.razonSocial });
        });
      
    
      });

      
      this.almacenService.getAllAlmacenes().subscribe(resp => {
            resp.forEach(element => {
              this.almacenes.push({ value: element.id ,  label : element.descripcion});
            });
        });

        this.generalService.getValorTabla(31).subscribe(resp =>
          {
            resp.forEach(element => {
              this.tiposingreso.push({ value: element.id , label: element.valorPrincipal});
            });
    
          });


        
      this.generalService.getValorTabla(31).subscribe(resp =>
        {
          resp.forEach(element => {
            this.tipodescarga.push({ value: element.id , label: element.valorPrincipal});
          });

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
  registrar() {
      if (this.form.invalid) return;

      this.confirmationService.confirm({
        message: '¿Está seguro que desea editar la ORI?',
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
            id: this.id
          };

    
          this.recepcionService
            .actualizar(model)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
              next: (resp) => {
                // ✅ Cierra y devuelve un payload al padre (éxito)
                this.ref.close({ ok: true, data: resp });
              },
              error: (err) => {
                // ✅ O bien no cierras y muestras algo local,
                // ✅ o cierras devolviendo el error para que el padre lo maneje:
                this.ref.close({
                  ok: false,
                  error: err?.error?.message || 'No se pudo registrar la ORI.'
                });
              }
            });
        }
      });
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
