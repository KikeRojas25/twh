import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class NewComponent implements OnInit {

  form: FormGroup;

  
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

  constructor(    public dialogService: DialogService,
    private almacenService: AlmacenService,
    private clienteService: ClienteService,
    private confirmationService: ConfirmationService ,
    private generalService: GeneralService,
    private recepcionService: RecepcionService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private router: Router) { 


      this.form = this.fb.group({
        almacenId: [null, Validators.required],
        propietarioId: [null, Validators.required],
        fechaEsperada: [ new Date(), Validators.required],
        horaEsperada: ['15:00', Validators.required],
        IdTipoIngreso: [null, Validators.required],
        IdDestino : [null, Validators.required],
        ordenCompra: ['', [Validators.minLength(5), Validators.maxLength(12),Validators.required]],
        guiaRemision: ['', [Validators.minLength(5), Validators.maxLength(50), Validators.required]],
        cantidad:         [
          null, 
          [Validators.required, Validators.min(1), Validators.max(100000)]
        ],
        peso:             [
          null, 
          [Validators.required, Validators.min(0.01), Validators.max(100000)]
        ],
        volumen:          [
          null, 
          [ Validators.min(0.01), Validators.max(100000)]
        ],

        proveedor: ['', [Validators.minLength(5), Validators.maxLength(50)]],
        entrega: ['', [Validators.minLength(5), Validators.maxLength(50)]],
      });


    }

  ngOnInit() {
    this.cargarCombos();

    this.model.horaEsperada = '15:00';

    
    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);




   
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

    if (this.form.invalid) {
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea agregar la ORI?',
      header: 'Agregar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
        const formValues = this.form.value;

        // Asignar los valores recuperados al modelo antes de enviarlo al API
        this.model = {
            almacenId: formValues.almacenId,
            propietario: this.propietarios.find(x => x.value === formValues.propietarioId)?.label || null,
            propietarioId: formValues.propietarioId,
            fechaEsperada: formValues.fechaEsperada,
            horaEsperada: formValues.horaEsperada,
            tipoIngresoId: formValues.IdTipoIngreso,
            destinoId: formValues.IdDestino,
            ordenCompra: formValues.ordenCompra,
            guiaRemision: formValues.guiaRemision,
            cantidad: formValues.cantidad,
            peso: formValues.peso,
            volumen: formValues.volumen,
            proveedor: formValues.proveedor,
            entrega: formValues.entrega,
            usuarioId: this.decodedToken.nameid,
        };
    this.model.usuarioid = this.decodedToken.nameid;


    this.recepcionService.registrar(this.model).subscribe(resp =>  {
        //this.model = resp;





      }, error => {

        console.log(error);

      }, () => {
        this.messageService.add({severity: 'success', summary: 'TWH', detail: 'Se registró correctamente.'})  //success('Se registró correctamente.');
        this.router.navigate(['/picking/verordensalida',  this.model ]);
      });


    } ,
    reject: () => {

    }

    });

  }

  
  onChangePropietario(propietario) {
    console.log(propietario);

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
