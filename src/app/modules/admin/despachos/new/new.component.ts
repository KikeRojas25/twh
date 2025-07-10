import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { DespachosService } from '../despachos.service';
import { ClienteService } from '../../_services/cliente.service';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { AlmacenService } from '../../_services/almacen.service';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { GeneralService } from '../../_services/general.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';



@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    MatIcon,
    CalendarModule,
    InputTextModule,
    PanelModule,
    ToastModule,
    RouterModule,
    ButtonModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    TableModule 
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ]
})
export class NewComponent implements OnInit {

  form: FormGroup;

  
  propietarios: SelectItem[] = [];
  clientes  : SelectItem[] = [];
  almacenes: SelectItem[] = [];
  direcciones: SelectItem[] = [];
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
    private despachoService: DespachosService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private router: Router) { 


      this.form = this.fb.group({
        almacenId: [null, Validators.required],
        propietarioId: [null, Validators.required],
        fechaRequerida: [ new Date(), Validators.required],
        horaRequerida: ['15:00', Validators.required],
        clienteId: [null, Validators.required],
        direccionId: [null, Validators.required],
        ordenCompraCliente: ['', [Validators.minLength(5), Validators.maxLength(50),Validators.required]],
        guiaRemision: ['', [Validators.minLength(5), Validators.maxLength(50), Validators.required]],
        guiaremisioningreso: ['', [Validators.minLength(5), Validators.maxLength(50), Validators.required]],
      });


    }

  ngOnInit() {
    this.cargarCombos();

    this.model.horaRequerida = '15:00';

    
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


      
    this.generalService.getValorTabla(43).subscribe(resp =>
      {
        resp.forEach(element => {
          this.tipodescarga.push({ value: element.id , label: element.valorPrincipal});
        });

      });
  }

  onChangePropietario(propietario) {
    console.log(propietario);

    this.clientes = [];

    this.clienteService.getAllClientesxPropietarios(propietario.value).subscribe(resp => {
      
    
      this.clientes = resp.map(element => ({
        value: element.id, 
        label: element.razonSocial
      })
    
    );
        // Verifica si hay solo un cliente en la lista
        if (this.clientes.length === 1) {
          const clienteUnico = this.clientes[0];

          // Asigna el único cliente al formulario
          this.form.get('clienteId').setValue(clienteUnico.value);

          // Llama a la función onChangeCliente con el cliente seleccionado
          this.onChangeCliente(clienteUnico);
        }

  });
}

  
  onChangeCliente(cliente){
    this.direcciones = [];

    this.clienteService.getAllDirecciones(cliente.value).subscribe(resp => {
      this.direcciones = resp.map(element => ({
        value: element.iddireccion,
        label: `${element.direccion} [ ${element.departamento} - ${element.provincia} - ${element.distrito} ]`
      }));

     // Verifica si hay solo una dirección en la lista
     if (this.direcciones.length === 1) {
      // Si es así, selecciona esa dirección automáticamente
      this.form.get('direccionId').setValue(this.direcciones[0].value);
    }
  });
}

  registrar() {

    if (this.form.invalid) {
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea agregar el despacho?',
      header: 'Agregar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
        const formValues = this.form.value;

        // Asignar los valores recuperados al modelo antes de enviarlo al API
        this.model = {
          almacenId: formValues.almacenId,
          Propietario: this.propietarios.find(x => x.value === formValues.propietarioId)?.label || null, // Obtener el label del propietario
          propietarioId: formValues.propietarioId,
          fechaRequerida: formValues.fechaRequerida, // Fecha requerida
          horaRequerida: formValues.horaRequerida,   // Hora requerida
          clienteId: formValues.clienteId,           // ID del cliente
          direccionId: formValues.direccionId,       // Dirección de entrega
          ordenCompraCliente: formValues.ordenCompraCliente, // Orden de compra del cliente
          guiaRemision: formValues.guiaRemision,     // Guía de remisión
          guiaremisioningreso: formValues.guiaremisioningreso, // Guía de remisión de ingreso
          ocingreso: formValues.ocingreso,           // Orden de compra de ingreso
          usuarioid: this.decodedToken.nameid,       // ID del usuario actual
      
          TipoRegistroId: 170, // Tipo de registro fijo
        };
    this.model.usuarioid = this.decodedToken.nameid;


    this.despachoService.RegistarOrdenSalida(this.model).subscribe(resp =>  {
        //this.model = resp;


        this.agregados.push({ guiaremision : formValues.guiaremisioningreso
          , oc :  formValues.ordenCompraCliente
          , id: resp });




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
  deleteOrder(id){
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar el despacho?',
      header: 'Eliminar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
   
    
  
            this.despachoService.deleteOrder(id).subscribe(x=> {
  
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
