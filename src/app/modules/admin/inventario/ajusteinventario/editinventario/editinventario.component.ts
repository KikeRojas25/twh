import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { SelectItem, ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CalendarModule } from 'primeng/calendar';
import { GeneralService } from '../../../_services/general.service';
import { InventarioService } from '../../../_services/inventario.service';
import moment from 'moment';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-editinventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    CalendarModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './editinventario.component.html',
  styleUrl: './editinventario.component.scss',
  
  
})
export class EditinventarioComponent implements OnInit{

  model: any = [];
  es: any;
  id: number;
  motivo: SelectItem[] = [];
  form: FormGroup;
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  decodedToken: any = {};
  jwtHelper = new JwtHelperService();
  
  constructor(
      private ref: DynamicDialogRef,
      private config: DynamicDialogConfig,
      private generalService: GeneralService,
      private inventarioService: InventarioService,
    ){}

  ngOnInit() : void {

    this.id =  this.config.data?.id;

    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);

    this.generalService.getValorTabla(38).subscribe( resp =>
    {
      resp.forEach(element => {
          this.motivo.push({
          value: element.id ,
          label: element.valorPrincipal
        });
      })
    });

    this.inventarioService.GetInventario(this.id).subscribe(x=> {
      this.model = x;

       if(x.fechaExpire !== null)
       this.model.fechaExpire   = moment(new Date(x.fechaExpire).toLocaleString(), 'DD/MM/YYYY').toDate()  ;
       else  this.model.fechaExpire = null;

       if(x.fechaManufactura !== null)
       this.model.fechaManufactura   = moment(new Date(x.fechaManufactura).toLocaleString(), 'DD/MM/YYYY').toDate()  ;
       else this.model.fechaManufactura = null;

    });

    this.es = {
      firstDayOfWeek: 1,
      dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
      monthNames: [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ],
      monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
      today: "Hoy",
      clear: "Limpiar"
    };
  }

  close(){
    this.ref?.close();
  }

 save() {
  // Validación opcional previa
  if (!this.model || !this.model.id) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Debe completar los datos requeridos antes de guardar.'
    });
    return;
  }

   this.model.idusuarioajuste = this.decodedToken.nameid;

  this.confirmationService.confirm({
    header: 'Confirmar Guardado',
    message: '¿Está seguro que desea guardar el ajuste del inventario?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Guardar',
    rejectLabel: 'Cancelar',
    acceptIcon: 'pi pi-check',
    rejectIcon: 'pi pi-times',
    
    accept: () => {
      this.inventarioService.proponerAjuste(this.model).subscribe({
        next: (resp) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Ajuste Propuesto',
            detail: resp.message || 'El ajuste fue registrado correctamente.'
          });
          this.ref.close(true); // Cierra el diálogo con valor de éxito
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo registrar el ajuste.'
          });
        }
      });
    },

    reject: () => {
      this.messageService.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'El registro fue cancelado por el usuario.'
      });
    }
  });
}


}
