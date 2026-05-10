import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { SelectItem, ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { GeneralService } from '../../../_services/general.service';

import { InputTextareaModule } from 'primeng/inputtextarea';
import moment from 'moment';
import { InventarioService } from 'app/modules/admin/_services/inventario.service';

@Component({
  selector: 'app-ajustestock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextareaModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './ajustestock.component.html',
  styleUrl: './ajustestock.component.scss'
})
export class AjustestockComponent implements OnInit{

  model: any = [];
  id: number;
  motivos: SelectItem[] = [];
  tipo: SelectItem[] = [];
  jwtHelper = new JwtHelperService();
  decodedToken: any = {};
  form: FormGroup;

  constructor(
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private generalService: GeneralService,
    private inventarioService: InventarioService,
  ){}

  ngOnInit() : void{

    this.id =  this.config.data?.id;
    const user  = localStorage.getItem('token');
    this.decodedToken = this.jwtHelper.decodeToken(user);

    this.generalService.getValorTabla(40).subscribe( resp =>
    {
      resp.forEach(element => {
          this.motivos.push({
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
  }

  close(){
    this.ref?.close();
  }

  /** Bloquea cualquier carácter que no sea dígito (0-9) en el input de cantidad. */
  onlyDigits(event: KeyboardEvent): void {
    // Permitir teclas de control (backspace, tab, flechas, etc.) — vienen sin char visible
    if (!event.key || event.key.length > 1) {
      return;
    }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /** Limpia el contenido pegado para dejar solo dígitos. */
  onPasteDigits(event: ClipboardEvent): void {
    const data = event.clipboardData?.getData('text') ?? '';
    if (!/^[0-9]+$/.test(data)) {
      event.preventDefault();
      const onlyNum = data.replace(/[^0-9]/g, '').slice(0, 4);
      if (onlyNum) {
        this.model.cantidad = Number(onlyNum);
      }
    }
  }

  save(){

    this.model.idusuarioajuste =   this.decodedToken.nameid;

    if(this.model.motivoid === undefined || this.model.motivoid === null
      || this.model.observacion === undefined || this.model.observacion === null
      || String(this.model.observacion).trim() === ''
      || this.model.cantidad === undefined || this.model.cantidad === null
      || String(this.model.cantidad).trim() === '')
    {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa los campos obligatorios.'
      });
      return;
    }

    if (String(this.model.observacion).length > 50) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Observación inválida',
        detail: 'La observación no debe superar los 50 caracteres.'
      });
      return;
    }

    const cantidadNum = Number(this.model.cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0 || cantidadNum > 9999) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad inválida',
        detail: 'La cantidad debe ser un número entero entre 0 y 9999.'
      });
      return;
    }
    this.model.cantidad = cantidadNum;

    this.confirmationService.confirm({
        message: '¿Estás seguro que deseas ajustar el stock?',
        header: 'Confirmación de ajuste',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.inventarioService.SolicitarActualizarStock(this.model).subscribe({
            next: (resp) => {
              if (resp === false) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Ajuste de Inventario',
                  detail: 'No se actualizó de manera correcta, verifique que tenga stock para ejecutar este cambio.'
                });
                return;
              }
              this.ref.close(true);
            },
            error: (err) => {
              const detalle = err?.status === 401 || err?.status === 403
                ? 'No autorizado. Vuelve a iniciar sesión.'
                : (err?.error?.message || err?.error || 'No se pudo registrar la solicitud de ajuste.');
              this.messageService.add({
                severity: 'error',
                summary: 'Ajuste de Inventario',
                detail: typeof detalle === 'string' ? detalle : 'No se pudo registrar la solicitud de ajuste.'
              });
            }
          });
        }
    });

  }

}
